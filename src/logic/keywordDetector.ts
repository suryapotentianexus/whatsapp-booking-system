import { ServiceType } from '../types';

export class KeywordDetector {
    static detectService(text: string): ServiceType | null {
        const lower = text.toLowerCase();
        // Use word boundaries for numbers to avoid matching "1" in "25/01"
        if (lower.includes('plumbing') || lower.includes('leak') || lower.includes('pipe') || lower.includes('sink') || /\b1\b/.test(lower)) {
            return ServiceType.PLUMBING;
        }
        if (lower.includes('electric') || lower.includes('wiring') || lower.includes('light') || /\b2\b/.test(lower)) {
            return ServiceType.ELECTRICAL;
        }
        if (lower.includes('inspection') || lower.includes('check') || lower.includes('general') || /\b3\b/.test(lower)) {
            return ServiceType.INSPECTION;
        }
        return null;
    }

    static detectDate(text: string): string | null {
        const lower = text.toLowerCase();
        const today = new Date();

        if (lower.includes('today')) {
            return this.formatDate(today);
        }

        if (lower.includes('tomorrow')) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return this.formatDate(tomorrow);
        }

        // Days of week
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        for (let i = 0; i < days.length; i++) {
            if (lower.includes(days[i])) {
                const targetDay = i;
                const currentDay = today.getDay();
                let daysToAdd = targetDay - currentDay;
                if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
                const date = new Date(today);
                date.setDate(date.getDate() + daysToAdd);
                return this.formatDate(date);
            }
        }

        // Month names (e.g., "25 jan", "25th january", "jan 25")
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        for (let i = 0; i < months.length; i++) {
            if (lower.includes(months[i])) {
                // Match patterns like "25 jan", "25th jan", "jan 25"
                // Use non-capturing group (?:...) to make ordinal suffix optional
                const dayMatch = text.match(/(\d{1,2})(?:st|nd|rd|th)?/);
                if (dayMatch) {
                    const day = parseInt(dayMatch[1]);
                    if (day >= 1 && day <= 31) { // Validate day range
                        const month = i; // 0-indexed
                        const year = today.getFullYear();

                        let date = new Date(year, month, day);
                        // If date is in the past, assume next year
                        if (date < today) {
                            date.setFullYear(year + 1);
                        }
                        return this.formatDate(date);
                    }
                }
            }
        }

        // Numeric dates (DD/MM or DD-MM)
        const dateMatch = text.match(/(\d{1,2})[\/-](\d{1,2})/);
        if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]) - 1; // JS months are 0-indexed
            const year = today.getFullYear();

            // Handle year rollover if date is in past? For now assume current year or next year if passed.
            let date = new Date(year, month, day);
            if (date < today) {
                date.setFullYear(year + 1);
            }
            return this.formatDate(date);
        }

        return null;
    }

    static detectTime(text: string): string | null {
        // Match HH:MM (optional am/pm) OR HH am/pm
        // 10:00, 10:00am, 10am. NOT "10" or "1".
        const timeMatch = text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b|\b(\d{1,2})\s*(am|pm)\b/i);
        if (timeMatch) {
            // Group 1-3: HH:MM (am/pm)
            // Group 4-5: HH am/pm
            let hour = parseInt(timeMatch[1] || timeMatch[4]);
            const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const meridiem = (timeMatch[3] || timeMatch[5])?.toLowerCase();

            if (meridiem === 'pm' && hour < 12) hour += 12;
            if (meridiem === 'am' && hour === 12) hour = 0;

            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
        return null;
    }

    static detectShortcuts(text: string): { service?: ServiceType, date?: string, time?: string } {
        return {
            service: this.detectService(text) || undefined,
            date: this.detectDate(text) || undefined,
            time: this.detectTime(text) || undefined
        };
    }

    private static formatDate(date: Date): string {
        const yyyy = date.getFullYear();
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
}
