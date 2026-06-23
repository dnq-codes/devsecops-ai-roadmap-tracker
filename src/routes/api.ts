import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { dbGet, dbAll, dbRun, findUserByUsername, findUserById, createUser, saveUserChat, getUserChat } from '../db/db';
import { recalculateMissedDays } from '../db/recalc';

const router = express.Router();

// Define Auth Request interface
export interface AuthRequest extends express.Request {
  userId?: string;
}

// Authentication middleware to isolate and protect student resources
const requireAuth = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const token = authHeader.substring(7);
  
  // Extract userId and username from the composite token format
  const parts = token.split('|||');
  const userId = parts[0];
  const username = parts.length > 1 ? parts[1] : null;

  let user = findUserById(userId);
  if (!user) {
    if (userId.startsWith('user_') && username) {
      // Dynamic recreate on server-side db reset to prevent logout across restarts
      user = createUser(username, 'restored_session', userId);
      console.log(`[AUTH SESSION RESTORED]: Automatically restored/recreated user: ${username} (${userId})`);
    } else {
      res.status(401).json({ error: 'Session expired or user deleted. Please sign in again.' });
      return;
    }
  }
  req.userId = user.id;
  next();
};

// POST /api/auth/signup - Registers a new student account
router.post('/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters long' });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters long' });
      return;
    }

    const existingUser = findUserByUsername(cleanUsername);
    if (existingUser) {
      res.status(400).json({ error: 'Username is already taken' });
      return;
    }

    const user = createUser(cleanUsername, password);
    res.json({
      success: true,
      token: `${user.id}|||${user.username}`,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error: any) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Server error during sign up' });
  }
});

// POST /api/auth/login - Signs in an existing student
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const user = findUserByUsername(username.trim());
    if (!user || user.passwordHash !== password) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    res.json({
      success: true,
      token: `${user.id}|||${user.username}`,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Server error during sign in' });
  }
});

// GET /api/progress - Returns all completed day IDs + the saved start date
router.get('/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const completedRows = await dbAll<{ day_id: number }>('SELECT day_id FROM progress', [], userId);
    const completed = completedRows.map(row => row.day_id);

    const configRow = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['start_date'], userId);
    const startDate = configRow ? configRow.value : null;

    const msgRow = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_message'], userId);
    const customNotificationMessage = msgRow ? msgRow.value : '';

    const timeRow = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_time'], userId);
    const customNotificationTime = timeRow ? timeRow.value : '';

    const enabledRow = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_enabled'], userId);
    const customNotificationEnabled = enabledRow ? enabledRow.value === 'true' : false;

    const goalsRow = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['daily_goals'], userId);
    let dailyGoals: any[] = [];
    if (goalsRow && goalsRow.value) {
      try {
        dailyGoals = JSON.parse(goalsRow.value);
      } catch (e) {
        console.error('Failed parsing daily_goals:', e);
      }
    }

    const aiMessages = getUserChat(userId);

    res.json({
      completed,
      startDate,
      customNotificationMessage,
      customNotificationTime,
      customNotificationEnabled,
      dailyGoals,
      aiMessages
    });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Server error retrieving status' });
  }
});

// POST /api/sync-backup - Bulk synchronizes a client-side localStorage state backup
router.post('/sync-backup', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId!;
    const { startDate, completed, customNotificationMessage, customNotificationTime, customNotificationEnabled, dailyGoals, aiMessages } = req.body;
    
    // 1. Save start date
    if (startDate !== undefined) {
      if (startDate) {
        const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['start_date'], userId);
        if (exists) {
          await dbRun('UPDATE config SET value = ? WHERE key = ?', [startDate, 'start_date'], userId);
        } else {
          await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['start_date', startDate], userId);
        }
      } else {
        const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['start_date'], userId);
        if (exists) {
          await dbRun('UPDATE config SET value = ? WHERE key = ?', ['', 'start_date'], userId);
        } else {
          await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['start_date', ''], userId);
        }
      }
    }

    // 2. Save completed progress day IDs
    if (Array.isArray(completed)) {
      // Clear all existing progress completions first
      await dbRun('DELETE FROM progress', [], userId);
      // Insert all completed day IDs
      for (const dayId of completed) {
        const completedAt = new Date().toISOString();
        await dbRun('INSERT INTO progress (day_id, completed_at) VALUES (?, ?)', [Number(dayId), completedAt], userId);
      }
    }

    // 3. Save notification config
    if (customNotificationMessage !== undefined) {
      const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_message'], userId);
      if (exists) {
        await dbRun('UPDATE config SET value = ? WHERE key = ?', [String(customNotificationMessage), 'custom_notification_message'], userId);
      } else {
        await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['custom_notification_message', String(customNotificationMessage)], userId);
      }
    }
    if (customNotificationTime !== undefined) {
      const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_time'], userId);
      if (exists) {
        await dbRun('UPDATE config SET value = ? WHERE key = ?', [String(customNotificationTime), 'custom_notification_time'], userId);
      } else {
        await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['custom_notification_time', String(customNotificationTime)], userId);
      }
    }
    if (customNotificationEnabled !== undefined) {
      const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_enabled'], userId);
      if (exists) {
        await dbRun('UPDATE config SET value = ? WHERE key = ?', [String(customNotificationEnabled), 'custom_notification_enabled'], userId);
      } else {
        await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['custom_notification_enabled', String(customNotificationEnabled)], userId);
      }
    }

    // 4. Save daily goals
    if (dailyGoals !== undefined) {
      const goalsStr = JSON.stringify(dailyGoals);
      const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['daily_goals'], userId);
      if (exists) {
        await dbRun('UPDATE config SET value = ? WHERE key = ?', [goalsStr, 'daily_goals'], userId);
      } else {
        await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['daily_goals', goalsStr], userId);
      }
    }

    // 5. Save chat history
    if (Array.isArray(aiMessages)) {
      saveUserChat(userId, aiMessages);
    }

    // Trigger missed days recalculation in background to keep cached values correct
    recalculateMissedDays(userId).catch(err => console.error('Background sync recalc error:', err));

    res.json({
      success: true,
      message: 'State synchronized successfully from local backup'
    });
  } catch (error: any) {
    console.error('Error synchronizing local backup:', error);
    res.status(500).json({ error: 'Server error synchronizing state' });
  }
});

// POST /api/daily-goals - Saves custom daily goals list
router.post('/daily-goals', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId!;
    const { goals } = req.body;
    
    if (goals !== undefined) {
      const valueStr = JSON.stringify(goals);
      const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['daily_goals'], userId);
      if (exists) {
        await dbRun('UPDATE config SET value = ? WHERE key = ?', [valueStr, 'daily_goals'], userId);
      } else {
        await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['daily_goals', valueStr], userId);
      }
    }

    res.json({
      success: true,
      goals: goals || []
    });
  } catch (error: any) {
    console.error('Error saving daily goals:', error);
    res.status(500).json({ error: 'Server error saving daily goals list' });
  }
});

// POST /api/custom-notification - Sets custom notification settings
router.post('/custom-notification', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId!;
    const { message, time, enabled } = req.body;
    
    if (message !== undefined) {
      const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_message'], userId);
      if (exists) {
        await dbRun('UPDATE config SET value = ? WHERE key = ?', [String(message), 'custom_notification_message'], userId);
      } else {
        await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['custom_notification_message', String(message)], userId);
      }
    }

    if (time !== undefined) {
      const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_time'], userId);
      if (exists) {
        await dbRun('UPDATE config SET value = ? WHERE key = ?', [String(time), 'custom_notification_time'], userId);
      } else {
        await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['custom_notification_time', String(time)], userId);
      }
    }

    if (enabled !== undefined) {
      const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['custom_notification_enabled'], userId);
      if (exists) {
        await dbRun('UPDATE config SET value = ? WHERE key = ?', [String(enabled), 'custom_notification_enabled'], userId);
      } else {
        await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['custom_notification_enabled', String(enabled)], userId);
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
router.post('/progress/toggle', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId!;
    const { dayId } = req.body;
    if (dayId === undefined || isNaN(dayId)) {
      res.status(400).json({ error: 'Missing or invalid dayId in request body' });
      return;
    }

    const dayNumber = Number(dayId);

    // Check if the day is already marked complete
    const existing = await dbGet<{ day_id: number }>('SELECT day_id FROM progress WHERE day_id = ?', [dayNumber], userId);

    let isCompletedNow = false;
    if (existing) {
      await dbRun('DELETE FROM progress WHERE day_id = ?', [dayNumber], userId);
      isCompletedNow = false;
    } else {
      const completedAt = new Date().toISOString();
      await dbRun('INSERT INTO progress (day_id, completed_at) VALUES (?, ?)', [dayNumber, completedAt], userId);
      isCompletedNow = true;
    }

    // Trigger asynchronous recalculation to keep the cached notifications synchronized
    recalculateMissedDays(userId).catch(err => console.error('Background recalculate error:', err));

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
router.post('/start-date', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId!;
    const { date } = req.body;
    if (!date) {
      res.status(400).json({ error: 'Missing date string in request body' });
      return;
    }

    // Standard cross-compatible upsert for database consistency
    const exists = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['start_date'], userId);
    if (exists) {
      await dbRun('UPDATE config SET value = ? WHERE key = ?', [date, 'start_date'], userId);
    } else {
      await dbRun('INSERT INTO config (key, value) VALUES (?, ?)', ['start_date', date], userId);
    }

    // Recalculate missed days synchronously since start date changed
    const notification = await recalculateMissedDays(userId);

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
router.post('/reset', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    await dbRun('DELETE FROM progress', [], userId);

    // Also reset AI chat histories
    saveUserChat(userId, [
      {
        role: 'assistant',
        content: "👋 Welcome! I am your AI DevOps & DevSecOps Mentor. Ask me any question about today's roadmap, request a hands-on mini-lab, or trigger a self-evaluation quiz!"
      }
    ]);

    // Sync notification calculations
    const notification = await recalculateMissedDays(userId);

    res.json({
      success: true,
      missedCount: notification.missedCount,
      statusMessage: notification.statusMessage,
      aiMessages: getUserChat(userId)
    });
  } catch (error: any) {
    console.error('Error resetting progress:', error);
    res.status(500).json({ error: 'Server error resetting roadmap progress' });
  }
});

// GET /api/notifications - Returns cached missed-day statistics and alert status
router.get('/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const freshCal = await recalculateMissedDays(userId);
    res.json({
      missedCount: freshCal.missedCount,
      statusMessage: freshCal.statusMessage,
      checkedAt: new Date().toISOString()
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
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || 'DUMMY_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

// POST /api/ai/chat - AI DevOps + Cloud Engineering Mentor Helper
router.post('/ai/chat', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.userId!;
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
      
      // Save full chat history safely
      const updatedMessages = [...messages, { role: 'assistant', content: responseText }];
      saveUserChat(userId, updatedMessages);

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

// POST /api/ai/quiz - Generates a 3-question multiple-choice quiz based on active day topic
router.post('/ai/quiz', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { dayNumber, dayTopic } = req.body;

    if (!dayNumber || !dayTopic) {
      res.status(400).json({ error: 'Missing dayNumber or dayTopic' });
      return;
    }

    const prompt = `Generate a high-quality, practical 3-question multiple-choice technical quiz about Day ${dayNumber}: "${dayTopic}".
Each question must be challenging, relevant, and cover realistic real-world DevOps, cloud engineering, or security scenarios about this topic.
Provide exactly 4 options per question, indicate the correct 0-indexed option (0 to 3), and provide a clear, instructive explanation of why that option is correct.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(400).json({
        error: '⚠️ Gemini API Key not found in server environments. Please supply GEMINI_API_KEY in Settings > Secrets to unlock the interactive Live AI Quiz system.'
      });
      return;
    }

    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an elite DevSecOps certification examiner. 
Your job is to generate precise, instructive multi-choice questions. 
Respond ONLY with a valid JSON payload matching the expected schema. 
Do not include markdown tags outside the JSON. All question/answer pairs must be strictly accurate.`,
        temperature: 0.6,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              description: "The list of 3 quiz questions",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: {
                    type: Type.STRING,
                    description: "The clear, direct multiple-choice question text."
                  },
                  options: {
                    type: Type.ARRAY,
                    description: "Exactly 4 options representing possible answers.",
                    items: { type: Type.STRING }
                  },
                  correctIndex: {
                    type: Type.INTEGER,
                    description: "The 0-based integer index of the correct option (0, 1, 2, or 3)."
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "A solid educational breakdown explaining why the selected option is correct."
                  }
                },
                required: ["question", "options", "correctIndex", "explanation"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
       throw new Error('Empty response from AI engine');
    }

    const parsedData = JSON.parse(textOutput.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error('Error generating live AI quiz:', error);
    res.status(500).json({ error: error.message || 'Failed to generate quiz' });
  }
});

export default router;
