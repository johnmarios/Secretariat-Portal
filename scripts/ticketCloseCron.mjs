import cron from 'node-cron';
import { closeStaleCompletedTickets } from '../model/db.js';

let ticketCloseCronStarted = false;

// npm start-> startTicketCloseCron()

export function startTicketCloseCron() {
    if (ticketCloseCronStarted) {
        return;
    }

    const enabled = String(process.env.ENABLE_TICKET_CLOSE_CRON || '').toLowerCase() === 'true';
    if (!enabled) {
        return;
    }


    const schedule = process.env.TICKET_CLOSE_CRON_SCHEDULE || '0 3 * * *';
    // awakens every day at 3am server time to close stale completed tickets 
    cron.schedule(schedule, async () => {
        try {
            const result = await closeStaleCompletedTickets();
            const affectedRows = result?.affectedRows ?? 0;
            console.log(`[ticket-close-cron] Closed ${affectedRows} stale completed ticket(s).`);
        } catch (error) {
            console.error('[ticket-close-cron] Failed to close stale completed tickets:', error);
        }
    });

    ticketCloseCronStarted = true;
    console.log(`[ticket-close-cron] Enabled with schedule: ${schedule}`);
}
