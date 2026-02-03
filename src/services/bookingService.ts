import { Booking, BookingStatus } from '../types';

export class BookingService {
    private static bookings: Booking[] = [];

    static createBooking(booking: Booking): void {
        this.bookings.push(booking);
        console.log(`[DB] Booking created: ${JSON.stringify(booking)}`);
    }

    static getBookings(): Booking[] {
        return this.bookings;
    }
}
