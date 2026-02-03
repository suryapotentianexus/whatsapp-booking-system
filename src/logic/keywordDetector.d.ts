import { ServiceType } from '../types';
export declare class KeywordDetector {
    static detectService(text: string): ServiceType | null;
    static detectDate(text: string): string | null;
    static detectTime(text: string): string | null;
    static detectShortcuts(text: string): {
        service?: ServiceType;
        date?: string;
        time?: string;
    };
    private static formatDate;
}
//# sourceMappingURL=keywordDetector.d.ts.map