import { Booking, BookingStatus } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class BookingService {
    private static bookings: Booking[] = BookingService.loadBookings();
    private static readonly DATA_DIR = path.join(process.cwd(), 'data');
    private static readonly FILE_PATH = path.join(BookingService.DATA_DIR, 'bookings.json');

    static createBooking(booking: Booking): void {
        this.bookings.push(booking);
        console.log(`[DB] Booking created: ${JSON.stringify(booking)}`);
        this.saveBookings();
    }

    static getBookings(): Booking[] {
        return this.bookings;
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
