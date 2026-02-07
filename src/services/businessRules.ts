import { Booking, BookingStatus } from '../types';
export class BusinessRules {
    private static readonly START_HOUR = 9;
    private static readonly END_HOUR = 17; // 5 PM
    private static readonly SLOT_DURATION_MINUTES = 60;

    static getAvailableSlots(dateStr: string): string[] {
        // In a real app, we would check existing bookings here.
        // For MVP, we just return all slots within working hours.

        const slots: string[] = [];
        let currentHour = this.START_HOUR;

        while (currentHour < this.END_HOUR) {
            const timeStr = `${currentHour.toString().padStart(2, '0')}:00`;
            slots.push(timeStr);
            currentHour++;
        }

        return slots;
    }

    static isValidSlot(dateStr: string, timeStr: string, existingBookings: Booking[] = []): { valid: boolean, reason?: 'OUTSIDE_WORKING_HOURS' | 'PAST_TIME' | 'ALREADY_BOOKED' } {
        const slots = this.getAvailableSlots(dateStr);
        if (!slots.includes(timeStr)) {
            return { valid: false, reason: 'OUTSIDE_WORKING_HOURS' };
        }

        // Temporal Validation: Check if the slot is in the past
        const now = new Date();
        const [year, month, day] = dateStr.split('-').map(Number);

        // Check if the booking date is today
        if (year === now.getFullYear() && month === (now.getMonth() + 1) && day === now.getDate()) {
            const [slotHour, slotMinute] = timeStr.split(':').map(Number);
            const slotTime = new Date(year, month - 1, day, slotHour, slotMinute);

            if (slotTime <= now) {
                return { valid: false, reason: 'PAST_TIME' };
            }
        }

        // Double Booking Validation
        const isBooked = existingBookings.some(b =>
            b.date === dateStr &&
            b.time === timeStr &&
            b.status === BookingStatus.CONFIRMED
        );

        if (isBooked) {
            return { valid: false, reason: 'ALREADY_BOOKED' };
        }

        return { valid: true };
    }

    static getWorkingHours(): string {
        return `${this.START_HOUR}:00 - ${this.END_HOUR}:00`;
    }
}
