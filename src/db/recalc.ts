import { dbGet, dbAll, dbRun } from './db';

// Recalculates missed days server side and saves the record in the notifications table, isolated by userId.
export async function recalculateMissedDays(userId?: string): Promise<{ missedCount: number; statusMessage: string }> {
  try {
    // 1. Fetch start date
    const configRow = await dbGet<{ value: string }>('SELECT value FROM config WHERE key = ?', ['start_date'], userId);
    if (!configRow || !configRow.value) {
      const defaultStatus = 'Roadmap has not started yet. Please set a start date in the setup panel!';
      // Seed an empty notification to be safe
      const checkedAt = new Date().toISOString();
      await dbRun('INSERT INTO notifications (missed_count, status_message, checked_at) VALUES (?, ?, ?)', [
        0,
        defaultStatus,
        checkedAt
      ], userId);
      return { missedCount: 0, statusMessage: defaultStatus };
    }

    const startDateStr = configRow.value;
    const startDate = new Date(startDateStr);
    const today = new Date();

    // Reset times to compare dates accurately in local time zones
    const startLocal = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Calculate difference in complete calendar days
    const diffTime = todayLocal.getTime() - startLocal.getTime();
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = daysPassed + 1; // Current day is day number (1-indexed)

    // If today is before start date, there are 0 missed days
    if (currentDay < 1) {
      const futureStatus = `Roadmap starting on ${startDateStr}. Prepare your resources!`;
      await dbRun('INSERT INTO notifications (missed_count, status_message, checked_at) VALUES (?, ?, ?)', [
        0,
        futureStatus,
        new Date().toISOString()
      ], userId);
      return { missedCount: 0, statusMessage: futureStatus };
    }

    // 2. Fetch completed day IDs
    const completedRows = await dbAll<{ day_id: number }>('SELECT day_id FROM progress', [], userId);
    const completedSet = new Set(completedRows.map(r => r.day_id));

    // 3. Define the maximum day to check. The roadmap ends at day 95.
    // Anything strictly before today's day number is a potential missed day.
    const maxDayToCheck = Math.min(95, currentDay - 1);

    let missedCount = 0;
    for (let d = 1; d <= maxDayToCheck; d++) {
      if (!completedSet.has(d)) {
        missedCount++;
      }
    }

    // 4. Generate the notification feedback text
    let statusMessage = '';
    if (missedCount === 0) {
      if (currentDay > 95) {
        statusMessage = "Congratulations! You have completed all 95 days of your DevSecOps + AI/ML learning journey!";
      } else {
        statusMessage = "Awesome! You are perfectly on track! You haven't missed any days.";
      }
    } else {
      statusMessage = `You missed ${missedCount} task${missedCount > 1 ? 's' : ''} since starting on ${startDateStr}. Head over to 'Missed' tab to recover!`;
    }

    // 5. Store cached notification record
    const checkedAt = new Date().toISOString();
    await dbRun('INSERT INTO notifications (missed_count, status_message, checked_at) VALUES (?, ?, ?)', [
      missedCount,
      statusMessage,
      checkedAt
    ], userId);

    return { missedCount, statusMessage };
  } catch (error) {
    console.error('Error during recalculateMissedDays:', error);
    return {
      missedCount: 0,
      statusMessage: 'Notification refresh error occurring server-side'
    };
  }
}
