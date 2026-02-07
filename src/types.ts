export enum ServiceType {
  PLUMBING = 'Plumbing',
  ELECTRICAL = 'Electrical',
  INSPECTION = 'General Inspection'
}

export enum ConversationStep {
  START = 'START',
  ASK_SERVICE = 'ASK_SERVICE',
  ASK_DATE = 'ASK_DATE',
  ASK_TIME = 'ASK_TIME',
  CONFIRMATION = 'CONFIRMATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum BookingStatus {
  INITIATED = 'initiated',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

export interface Booking {
  id: string;
  service: ServiceType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerPhone: string;
  status: BookingStatus;
  createdAt: Date;
  reminderSent?: boolean; // Flag to track if reminder has been sent
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
