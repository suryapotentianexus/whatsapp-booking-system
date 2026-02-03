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

    static isValidSlot(dateStr: string, timeStr: string): boolean {
        const slots = this.getAvailableSlots(dateStr);
        return slots.includes(timeStr);
    }

    static getWorkingHours(): string {
        return `${this.START_HOUR}:00 - ${this.END_HOUR}:00`;
    }
}
