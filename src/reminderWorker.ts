import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Booking, BookingStatus } from './types';
import { getServiceDisplayName } from './config/services';

dotenv.config();

/**
 * WhatsApp Reminder Worker
 * 
 * Runs every 5 minutes to check for upcoming confirmed bookings
 * and sends WhatsApp reminders 60 minutes before the appointment.
 * 
 * Integration Boundaries:
 * - Reads from data/bookings.json (same persistence as BookingService)
 * - Uses existing WhatsApp Cloud API integration
 * - Fully isolated from booking logic and state machine
 * - Only updates reminderSent flag, never modifies booking status or details
 */

const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// Reminder window: 60 minutes before appointment
const REMINDER_WINDOW_MINUTES = 60;
// Worker interval: 5 minutes
const WORKER_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Load bookings from JSON persistence
 */
function loadBookings(): Booking[] {
    try {
        if (!fs.existsSync(BOOKINGS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
        const bookings = JSON.parse(data) as Booking[];

        // Convert createdAt string back to Date object
        return bookings.map(b => ({
            ...b,
            createdAt: new Date(b.createdAt)
        }));
    } catch (error) {
        console.error('[ReminderWorker] Failed to load bookings:', error);
        return [];
    }
}

/**
 * Save bookings to JSON persistence (atomic write)
 */
function saveBookings(bookings: Booking[]): void {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        const tempFile = `${BOOKINGS_FILE}.tmp`;
        fs.writeFileSync(tempFile, JSON.stringify(bookings, null, 2), 'utf-8');
        fs.renameSync(tempFile, BOOKINGS_FILE);
    } catch (error) {
        console.error('[ReminderWorker] Failed to save bookings:', error);
    }
}

/**
 * Send WhatsApp reminder message
 */
async function sendWhatsAppReminder(to: string, service: string, time: string): Promise<boolean> {
    try {
        const message = `🔧 Reminder: You have a ${service} scheduled today at ${time}.\nPlease reply CANCEL if you are unable to attend.`;

        await axios.post(
            `https://graph.facebook.com/v24.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                text: { body: message }
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`[ReminderWorker] ✅ Sent reminder to ${to} for ${service} at ${time}`);
        return true;
    } catch (error: any) {
        console.error('[ReminderWorker] ❌ Failed to send reminder:', error?.response?.data || error.message);
        return false;
    }
}

/**
 * Check and process reminders for upcoming bookings
 */
async function processReminders(): Promise<void> {
    console.log('[ReminderWorker] 🔍 Checking for upcoming bookings...');

    const bookings = loadBookings();
    const now = new Date();
    let updatedBookings = false;

    for (const booking of bookings) {
        // Skip if reminder already sent
        if (booking.reminderSent) {
            continue;
        }

        // Only send reminders for confirmed bookings
        if (booking.status !== BookingStatus.CONFIRMED) {
            continue;
        }

        // Parse booking date and time
        const [year, month, day] = booking.date.split('-').map(Number);
        const [hour, minute] = booking.time.split(':').map(Number);
        const bookingTime = new Date(year, month - 1, day, hour, minute);

        // Skip past bookings
        if (bookingTime <= now) {
            continue;
        }

        // Calculate time difference in minutes
        const diffMs = bookingTime.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        // Send reminder if within 60-minute window
        if (diffMinutes <= REMINDER_WINDOW_MINUTES && diffMinutes > 0) {
            const serviceDisplayName = getServiceDisplayName(booking.service);
            const success = await sendWhatsAppReminder(
                booking.customerPhone,
                serviceDisplayName,
                booking.time
            );

            if (success) {
                booking.reminderSent = true;
                updatedBookings = true;
            }
        }
    }

    // Save updated bookings if any reminders were sent
    if (updatedBookings) {
        saveBookings(bookings);
        console.log('[ReminderWorker] 💾 Updated booking records');
    }
}

/**
 * Start the reminder worker
 */
async function startWorker(): Promise<void> {
    console.log('🚀 [ReminderWorker] Starting WhatsApp Reminder Worker');
    console.log(`⏰ [ReminderWorker] Checking every ${WORKER_INTERVAL_MS / 1000 / 60} minutes`);
    console.log(`📢 [ReminderWorker] Sending reminders ${REMINDER_WINDOW_MINUTES} minutes before appointments`);

    // Run immediately on start
    await processReminders();

    // Then run every 5 minutes
    setInterval(async () => {
        await processReminders();
    }, WORKER_INTERVAL_MS);
}

// Start the worker
startWorker().catch(error => {
    console.error('[ReminderWorker] Fatal error:', error);
    process.exit(1);
});
