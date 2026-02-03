export declare enum ServiceType {
    PLUMBING = "Plumbing",
    ELECTRICAL = "Electrical",
    INSPECTION = "General Inspection"
}
export declare enum ConversationStep {
    START = "START",
    ASK_SERVICE = "ASK_SERVICE",
    ASK_DATE = "ASK_DATE",
    ASK_TIME = "ASK_TIME",
    CONFIRMATION = "CONFIRMATION",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum BookingStatus {
    INITIATED = "initiated",
    CONFIRMED = "confirmed",
    CANCELLED = "cancelled"
}
export interface Booking {
    id: string;
    service: ServiceType;
    date: string;
    time: string;
    customerPhone: string;
    status: BookingStatus;
    createdAt: Date;
}
export interface ConversationState {
    phoneNumber: string;
    currentStep: ConversationStep;
    selectedService?: ServiceType;
    selectedDate?: string;
    selectedTime?: string;
    lastMessage?: string;
    updatedAt: Date;
}
//# sourceMappingURL=types.d.ts.map