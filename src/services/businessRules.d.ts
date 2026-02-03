export declare class BusinessRules {
    private static readonly START_HOUR;
    private static readonly END_HOUR;
    private static readonly SLOT_DURATION_MINUTES;
    static getAvailableSlots(dateStr: string): string[];
    static isValidSlot(dateStr: string, timeStr: string): boolean;
    static getWorkingHours(): string;
}
//# sourceMappingURL=businessRules.d.ts.map