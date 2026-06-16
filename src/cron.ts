import cron from 'node-cron';
import { recalculateMissedDays } from './db/recalc';

export function startCronJobs() {
  console.log('[CRON SERVICE]: Registering cron scheduling hooks...');

  // Running once a day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    const timestamp = new Date().toISOString();
    console.log(`[CRON SCHEDULE - ${timestamp}]: Initiating automated daily progress scan...`);
    try {
      const result = await recalculateMissedDays();
      console.log(`[CRON COMPLETE - ${timestamp}]: Recalculated successfully. Missed count: ${result.missedCount}`);
    } catch (error) {
      console.error(`[CRON FAILURE - ${timestamp}]: Calculation routine error:`, error);
    }
  });

  // Seeds database with an initial calculation on server startup
  console.log('[CRON SERVICE]: Prompting initial startup statistics scan...');
  recalculateMissedDays()
    .then((result) => {
      console.log(`[CRON SERVICE INITIALIZED]: Initial scan completed. Seeded missed count: ${result.missedCount}`);
    })
    .catch((error) => {
      console.error('[CRON SERVICE ERROR]: Initial statistcs seed failed:', error);
    });
}
