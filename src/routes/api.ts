import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { dbGet, dbAll, dbRun } from '../db/db';
import { recalculateMissedDays } from '../db/recalc';

const router = express.Router();

// GET /api/progress - Returns all completed day IDs + the saved start date
router.get('/progress', async (req, res) => {
  try {
    const completedRows = await dbAll<{ day_id: number }>('SELECT day_id FROM progress');
    const completed = completedRows.map(row => row.day_id);

    const configRow = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['start_date']);
    const startDate = configRow ? configRow.value : null;

    const msgRow = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_message']);
    const customNotificationMessage = msgRow ? msgRow.value : '';

    const timeRow = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_time']);
    const customNotificationTime = timeRow ? timeRow.value : '';

    const enabledRow = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_enabled']);
    const customNotificationEnabled = enabledRow ? enabledRow.value === 'true' : false;

    res.json({
      completed,
      startDate,
      customNotificationMessage,
      customNotificationTime,
      customNotificationEnabled
    });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Server error retrieving your status' });
  }
});

// POST /api/custom-notification - Sets custom notification settings
router.post('/custom-notification', async (req: express.Request, res: express.Response) => {
  try {
    const { message, time, enabled } = req.body;
    
    if (message !== undefined) {
      const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_message']);
      if (exists) {
        await dbRun('UPDATE config SET value = ? WHERE key = ?', [String(message), 'custom_notification_message']);
      } else {
        await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['custom_notification_message', String(message)]);
      }
    }

    if (time !== undefined) {
      const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_time']);
      if (exists) {
        await dbRun('UPDATE config SET value = ? WHERE key = ?', [String(time), 'custom_notification_time']);
      } else {
        await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['custom_notification_time', String(time)]);
      }
    }

    if (enabled !== undefined) {
      const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_enabled']);
      if (exists) {
        await dbRun('UPDATE config SET value = ? WHERE key = ?', [String(enabled), 'custom_notification_enabled']);
      } else {
        await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['custom_notification_enabled', String(enabled)]);
      }
    }

    res.json({
      success: true,
      message,
      time,
      enabled
    });
  } catch (error: any) {
    console.error('Error saving custom notification:', error);
    res.status(500).json({ error: 'Server error saving custom notification credentials' });
  }
});

// POST /api/progress/toggle - Toggles the completion of a specific day
router.post('/progress/toggle', async (req: express.Request, res: express.Response) => {
  try {
    const { dayId } = req.body;
    if (dayId === undefined || isNaN(dayId)) {
      res.status(400).json({ error: 'Missing or invalid dayId in request body' });
      return;
    }

    const dayNumber = Number(dayId);

    // Check if the day is already marked complete
    const existing = await dbGet<{ day_id: number }>('SELECT day_id FROM progress WHERE day_id = ?', [dayNumber]);

    let isCompletedNow = false;
    if (existing) {
      await dbRun('DELETE FROM progress WHERE day_id = ?', [dayNumber]);
      isCompletedNow = false;
    } else {
      const completedAt = new Date().toISOString();
      await dbRun('INSERT INTO progress (day_id, completed_at) VALUES (?, ?)', [dayNumber, completedAt]);
      isCompletedNow = true;
    }

    // Trigger asynchronous recalculation to keep the cached notifications synchronized
    recalculateMissedDays().catch(err => console.error('Background recalculate error:', err));

    res.json({
      dayId: dayNumber,
      completed: isCompletedNow
    });
  } catch (error: any) {
    console.error('Error in progress toggle:', error);
    res.status(500).json({ error: 'Server error toggling day task progress' });
  }
});

// POST /api/start-date - Sets/changes the roadmap start date
router.post('/start-date', async (req: express.Request, res: express.Response) => {
  try {
    const { date } = req.body;
    if (!date) {
      res.status(400).json({ error: 'Missing date string in request body' });
      return;
    }

    // Standard cross-compatible upsert for database consistency
    const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['start_date']);
    if (exists) {
      await dbRun('UPDATE config SET value = ? WHERE key = ?', [date, 'start_date']);
    } else {
      await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['start_date', date]);
    }

    // Recalculate missed days synchronously since start date changed
    const notification = await recalculateMissedDays();

    res.json({
      success: true,
      startDate: date,
      missedCount: notification.missedCount,
      statusMessage: notification.statusMessage
    });
  } catch (error: any) {
    console.error('Error in setting start date:', error);
    res.status(500).json({ error: 'Server error saving roadmap start date' });
  }
});

// POST /api/reset - Clears all progress (keeping the start date intact)
router.post('/reset', async (req, res) => {
  try {
    await dbRun('DELETE FROM progress');

    // Sync notification calculations
    const notification = await recalculateMissedDays();

    res.json({
      success: true,
      missedCount: notification.missedCount,
      statusMessage: notification.statusMessage
    });
  } catch (error: any) {
    console.error('Error resetting progress:', error);
    res.status(500).json({ error: 'Server error resetting roadmap progress' });
  }
});

// GET /api/notifications - Returns cached missed-day statistics and alert status
router.get('/notifications', async (req, res) => {
  try {
    let latestNotification = await dbGet<{
      missed_count: number;
      status_message: string;
      checked_at: string;
    }>('SELECT missed_count, status_message, checked_at FROM notifications ORDER BY id DESC LIMIT 1');

    // If no notification records exist, seed one immediately
    if (!latestNotification) {
      const freshCal = await recalculateMissedDays();
      res.json({
        missedCount: freshCal.missedCount,
        statusMessage: freshCal.statusMessage,
        checkedAt: new Date().toISOString()
      });
      return;
    }

    res.json({
      missedCount: latestNotification.missed_count,
      statusMessage: latestNotification.status_message,
      checkedAt: latestNotification.checked_at
    });
  } catch (error: any) {
    console.error('Error retrieving notifications:', error);
    res.status(500).json({ error: 'Server error retrieving current alerts' });
  }
});

let aiInstance: GoogleGenAI | null = null;
function getAIInstance() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY' });
  }
  return aiInstance;
}

// POST /api/ai/chat - AI DevOps + Cloud Engineering Mentor Helper
router.post('/ai/chat', async (req: express.Request, res: express.Response) => {
  try {
    const { messages, dayTopic, dayNumber, phase } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Missing messages array' });
      return;
    }

    const systemInstruction = `You are the ultimate 95-Day DevSecOps & AI/ML Platform Mentor, guiding the student through their learning roadmap.
Active Phase of User: ${phase || 'Phase 1 - Foundation'}
Current Day focusing on: Day ${dayNumber || '1'}
Specific Topic of focus: ${dayTopic || 'General DevOps / Linux'}

- Your tone should be supportive, highly technical, motivating, and clear.
- When explaining terminal commands, bash scripts, or infrastructure definitions (YAML, Dockerfile, Terraform, Helm), provide direct, fully-functional copy-pasteable examples.
- Use clean markdown layouts with codeblocks specifying coding syntax.
- Deliver actual study-lab recommendations or mini-quizzes on the current day's topic if prompt chips or conversations request them.
- If asked unrelated tasks, steer them gently back to our 95-day DevOps roadmap focus.
- Keep responses compact, clean, and fast with no generic preambles.`;

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    }));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json({
        text: `⚠️ **AI Mentor Offline**: The environment secret \`GEMINI_API_KEY\` is not configure in this workspace.

To enable this free live assistant:
1. Open the **Settings** menu.
2. Under Environment Variables, add \`GEMINI_API_KEY\` with your Google AI Studio API key.
3. Reload this workspace to chat and practice interactive labs live with Gemini!`
      });
      return;
    }

    try {
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const responseText = response.text || "I apologize, but I couldn't generate a mentor response right now.";
      res.json({ text: responseText });
    } catch (apiErr: any) {
      console.error('Gemini API query execution failed:', apiErr);
      res.json({
        text: `⚠️ **Gemini Service Alert**: Failed to establish connection with Google GenAI.
        \n\n*Error details: ${apiErr.message || 'Verification / authentication failed'}*`
      });
    }
  } catch (error: any) {
    console.error('Error in AI Assistant routing segment:', error);
    res.status(500).json({ error: 'AI Assistant route processor failure' });
  }
});

export default router;
