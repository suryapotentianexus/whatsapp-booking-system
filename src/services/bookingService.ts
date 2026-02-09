import { Booking, BookingStatus } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class BookingService {
    private static bookings: Booking[] = BookingService.loadBookings();
    private static readonly DATA_DIR = path.join(process.cwd(), 'data');
    private static readonly FILE_PATH = path.join(BookingService.DATA_DIR, 'bookings.json');

    static createBooking(booking: Booking): void {
        // RELOAD FIRST to stay in sync with other processes (e.g., ReminderWorker)
        this.bookings = this.loadBookings();
        this.bookings.push(booking);
        console.log(`[DB] Booking created: ${JSON.stringify(booking)}`);
        this.saveBookings();
    }

    static getBookings(): Booking[] {
        // RELOAD FIRST to ensure availability checks use fresh data
        this.bookings = this.loadBookings();
        return this.bookings;
    }

    /**
     * CENTRALIZED CANCELLATION LOGIC
     * Cancels an active booking for a given phone number
     * Updates status to 'cancelled' and persists to release the slot
     * 
     * Used by:
     * - Booking flow cancellation (NO at confirmation)
     * - Reminder-triggered cancellation (CANCEL reply)
     * 
     * @param phoneNumber - Customer phone number
     * @returns true if booking was found and cancelled, false otherwise
     */
    static cancelBooking(phoneNumber: string): boolean {
        // RELOAD FIRST to stay in sync with other processes
        this.bookings = this.loadBookings();

        // 1. PRIORITIZE: Find a booking that was reminded (likely the target of a "reminded" cancel)
        // This fixes the issue where a newer booking is cancelled instead of the one that triggered the reminder.
        const remindedBooking = this.bookings
            .filter(b => b.customerPhone === phoneNumber && b.status === BookingStatus.CONFIRMED && b.reminderSent === true)
            // If multiple, pick the one created most recently among the reminded ones
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (remindedBooking) {
            console.log(`[DB] Target found via reminder flag: ${remindedBooking.id} (${remindedBooking.time})`);
            remindedBooking.status = BookingStatus.CANCELLED;
            this.saveBookings();
            return true;
        }

        // 2. FALLBACK: Find the most recent confirmed booking for this phone number
        const booking = this.bookings
            .filter(b => b.customerPhone === phoneNumber && b.status === BookingStatus.CONFIRMED)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (!booking) {
            console.log(`[DB] No active booking found for ${phoneNumber}`);
            return false;
        }

        // Update status to cancelled
        booking.status = BookingStatus.CANCELLED;
        console.log(`[DB] Booking cancelled: ${JSON.stringify(booking)}`);

        // Persist changes to release the slot
        this.saveBookings();
        return true;
    }

    private static loadBookings(): Booking[] {
        try {
            const dataDir = path.join(process.cwd(), 'data');
            const filePath = path.join(dataDir, 'bookings.json');

            if (!fs.existsSync(filePath)) {
                return [];
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data) as Booking[];
        } catch (error) {
            console.warn('[Persistence] Failed to load bookings, starting empty:', error);
            return [];
        }
    }

    private static saveBookings(): void {
        try {
            if (!fs.existsSync(this.DATA_DIR)) {
                fs.mkdirSync(this.DATA_DIR, { recursive: true });
            }
            const tempFile = `${this.FILE_PATH}.tmp`;
            fs.writeFileSync(tempFile, JSON.stringify(this.bookings, null, 2), 'utf-8');
            fs.renameSync(tempFile, this.FILE_PATH);
        } catch (error) {
            console.error('[Persistence] Failed to save bookings:', error);
        }
    }
}
