import { ConversationState, ConversationStep, ServiceType, BookingStatus } from '../types';
import { StateMachine } from './stateMachine';
import { KeywordDetector } from './keywordDetector';
import { BusinessRules } from '../services/businessRules';
import { ConversationService } from '../services/conversationService';
import { BookingService } from '../services/bookingService';
import { v4 as uuidv4 } from 'uuid';
import { getServiceListDisplay, getServiceDisplayName } from '../config/services';

export class MessageHandler {
    /**
     * Normalize greeting input by collapsing repeated letters
     * Examples: "hiiiii" -> "hi", "heyyyy" -> "hey", "helloooo" -> "hello"
     */
    private static normalizeGreeting(text: string): string {
        return text.toLowerCase().trim().replace(/(.)\1+/g, '$1');
    }

    /**
     * Check if normalized text is a greeting
     */
    private static isGreeting(text: string): boolean {
        const normalized = this.normalizeGreeting(text);
        return ['hi', 'helo', 'hey', 'start'].includes(normalized);
    }

    static handleMessage(phoneNumber: string, text: string): string {
        let state = ConversationService.getState(phoneNumber);
        const lowerText = text.toLowerCase().trim();

        // ------------------------------------------------
        // 1) Handle GLOBAL commands (cancel, restart, help)
        // ------------------------------------------------
        if (state.currentStep === ConversationStep.START ||
            state.currentStep === ConversationStep.COMPLETED ||
            state.currentStep === ConversationStep.CANCELLED) {
            if (['hi', 'hello', 'book', 'appointment', 'start', 'restart'].some(k => lowerText.includes(k))) {
                const next = StateMachine.getNextStep(state, 'restart');
                state = { ...state, ...next };
                ConversationService.updateState(state);
                return this.getResponse(state);
            }
        }

        if (['cancel', 'restart', 'help'].includes(lowerText)) {
            if (lowerText === 'help') {
                return "I can help you book an appointment. You can say 'Restart' to start over or 'Cancel' to stop.";
            }
            const next = StateMachine.getNextStep(state, lowerText);
            state = { ...state, ...next };
            ConversationService.updateState(state);
            return this.getResponse(state);
        }

        // ------------------------------------------------
        // 2) HANDLE ASK_SERVICE STATE FIRST (NO EXCEPTIONS)
        // ------------------------------------------------
        if (state.currentStep === ConversationStep.ASK_SERVICE) {
            // UX FIX 1: Handle greetings properly ("Hi", "Hiiiii", "Hello", etc.)
            if (this.isGreeting(text)) {
                // Return friendly greeting with service list
                return this.getResponse(state);
            }

            const service = KeywordDetector.detectService(text);
            if (service) {
                state.selectedService = service;

                // Check if user also provided date/time in the same message (shortcut support)
                const date = KeywordDetector.detectDate(text);
                const time = KeywordDetector.detectTime(text);

                if (date) state.selectedDate = date;

                // CRITICAL: Validate time against working hours before accepting
                if (time) {
                    // If we have a date selected, validate the time slot
                    // If we have a date selected, validate the time slot
                    if (state.selectedDate) {
                        const validation = BusinessRules.isValidSlot(state.selectedDate, time, BookingService.getBookings());
                        if (!validation.valid) {
                            const availableSlots = BusinessRules.getAvailableSlots(state.selectedDate);
                            const slotsDisplay = availableSlots.slice(0, 3).map(s => `• ${s}`).join('\n');

                            if (validation.reason === 'PAST_TIME') {
                                return `Sorry, ${time} has already passed today.\n\nAvailable time slots on ${state.selectedDate}:\n${slotsDisplay}\n...\n\nPlease choose a future time.`;
                            } else if (validation.reason === 'ALREADY_BOOKED') {
                                return `Sorry, that time slot is already booked. Please choose another time.`;
                            } else {
                                const workingHours = BusinessRules.getWorkingHours();
                                return `Sorry, ${time} is outside our working hours (${workingHours}).\n\nAvailable time slots on ${state.selectedDate}:\n${slotsDisplay}\n...\n\nPlease choose a time within working hours.`;
                            }
                        }
                    }
                    state.selectedTime = time;
                }

                // Intelligent step transition
                if (state.selectedService && state.selectedDate && state.selectedTime) {
                    state.currentStep = ConversationStep.CONFIRMATION;
                } else if (state.selectedService && state.selectedDate) {
                    state.currentStep = ConversationStep.ASK_TIME;
                } else {
                    state.currentStep = ConversationStep.ASK_DATE;
                }

                ConversationService.updateState(state);
                return this.getResponse(state);
            } else {
                // Respond with service clarification message and RETURN
                const serviceList = getServiceListDisplay();
                return `Sorry, I didn't catch that 😊\nPlease reply with:\n${serviceList}`;
            }
        }

        // ------------------------------------------------
        // 3) ONLY AFTER THAT -> Shortcut Detection
        // ------------------------------------------------
        // Shortcut detection (service + date + time) must run:
        // - ONLY when NOT in ASK_SERVICE (already handled above)
        // - OR when conversation is COMPLETED / CANCELLED / START

        const shortcuts = KeywordDetector.detectShortcuts(text);
        let shortcutTriggered = false;

        // If in End State (Completed/Cancelled) or Start, any shortcut implies a NEW booking.
        if (shortcuts.service || shortcuts.date || shortcuts.time) {
            if (state.currentStep === ConversationStep.COMPLETED ||
                state.currentStep === ConversationStep.CANCELLED ||
                state.currentStep === ConversationStep.START) {

                state = {
                    phoneNumber: state.phoneNumber,
                    currentStep: ConversationStep.ASK_SERVICE,
                    updatedAt: new Date()
                };
            }
        }

        if (shortcuts.service) { state.selectedService = shortcuts.service; shortcutTriggered = true; }
        if (shortcuts.date) { state.selectedDate = shortcuts.date; shortcutTriggered = true; }

        // CRITICAL: Validate time against working hours before accepting
        if (shortcuts.time) {
            // If we have a date selected, validate the time slot
            // If we have a date selected, validate the time slot
            if (state.selectedDate) {
                const validation = BusinessRules.isValidSlot(state.selectedDate, shortcuts.time, BookingService.getBookings());
                if (!validation.valid) {
                    const availableSlots = BusinessRules.getAvailableSlots(state.selectedDate);
                    const slotsDisplay = availableSlots.slice(0, 3).map(s => `• ${s}`).join('\n');

                    if (validation.reason === 'PAST_TIME') {
                        return `Sorry, ${shortcuts.time} has already passed today.\n\nAvailable time slots on ${state.selectedDate}:\n${slotsDisplay}\n...\n\nPlease choose a future time.`;
                    } else if (validation.reason === 'ALREADY_BOOKED') {
                        return `Sorry, that time slot is already booked. Please choose another time.`;
                    } else {
                        const workingHours = BusinessRules.getWorkingHours();
                        return `Sorry, ${shortcuts.time} is outside our working hours (${workingHours}).\n\nAvailable time slots on ${state.selectedDate}:\n${slotsDisplay}\n...\n\nPlease choose a time within working hours.`;
                    }
                }
            }
            state.selectedTime = shortcuts.time;
            shortcutTriggered = true;
        }

        if (shortcutTriggered) {
            // Intelligent skipping
            if (state.selectedService && state.selectedDate && state.selectedTime) {
                state.currentStep = ConversationStep.CONFIRMATION;
            } else if (state.selectedService && state.selectedDate) {
                state.currentStep = ConversationStep.ASK_TIME;
            } else if (state.selectedService) {
                state.currentStep = ConversationStep.ASK_DATE;
            } else {
                state.currentStep = ConversationStep.ASK_SERVICE;
            }

            ConversationService.updateState(state);
            return this.getResponse(state);
        }

        // ------------------------------------------------
        // 4) Then normal state-based handling
        // ------------------------------------------------
        switch (state.currentStep) {
            case ConversationStep.START:
                state.currentStep = ConversationStep.ASK_SERVICE;
                ConversationService.updateState(state);
                return this.getResponse(state);

            // ASK_SERVICE is handled exclusively in block (2) above.

            case ConversationStep.ASK_DATE:
                const date = KeywordDetector.detectDate(text);
                if (date) {
                    state.selectedDate = date;
                    state.currentStep = ConversationStep.ASK_TIME;
                    ConversationService.updateState(state);
                    return this.getResponse(state);
                } else {
                    // ISSUE 2 FIX: Dynamic future-safe date examples
                    return "Sorry, I didn't catch that date. You can say 'Today', 'Tomorrow', or 'In 3 days'.";
                }

            case ConversationStep.ASK_TIME:
                const time = KeywordDetector.detectTime(text);
                if (time) {
                    const validation = BusinessRules.isValidSlot(state.selectedDate!, time, BookingService.getBookings());
                    if (validation.valid) {
                        state.selectedTime = time;
                        state.currentStep = ConversationStep.CONFIRMATION;
                        ConversationService.updateState(state);
                        return this.getResponse(state);
                    } else {
                        const availableSlots = BusinessRules.getAvailableSlots(state.selectedDate!);
                        const slotsDisplay = availableSlots.slice(0, 3).map(s => `• ${s}`).join('\n');

                        if (validation.reason === 'PAST_TIME') {
                            // ISSUE 4 FIX: Stay in ASK_TIME state, preserve date context
                            return `Sorry, ${time} has already passed today.\n\nAvailable time slots on ${state.selectedDate}:\n${slotsDisplay}\n...\n\nPlease choose a future time.`;
                        } else if (validation.reason === 'ALREADY_BOOKED') {
                            // ISSUE 4 FIX: Stay in ASK_TIME state, preserve date context
                            return `Sorry, that time slot is already booked. Please choose another time.`;
                        } else {
                            const workingHours = BusinessRules.getWorkingHours();
                            return `Sorry, ${time} is outside our working hours (${workingHours}).\n\nAvailable time slots on ${state.selectedDate}:\n${slotsDisplay}\n...\n\nPlease choose a time within working hours.`;
                        }
                    }
                } else {
                    return "Please reply with a valid time (e.g., 10:00, 2pm).";
                }

            case ConversationStep.CONFIRMATION:
                if (lowerText === 'yes' || lowerText === 'y') {
                    BookingService.createBooking({
                        id: Date.now().toString(),
                        service: state.selectedService!,
                        date: state.selectedDate!,
                        time: state.selectedTime!,
                        customerPhone: phoneNumber,
                        status: BookingStatus.CONFIRMED,
                        createdAt: new Date()
                    });
                    state.currentStep = ConversationStep.COMPLETED;
                    ConversationService.updateState(state);
                    return this.getResponse(state);
                } else if (lowerText === 'no' || lowerText === 'n') {
                    // ISSUE 3 FIX: Preserve service and date, go back to time selection
                    // Do NOT clear service or date - user can pick a different time
                    state.currentStep = ConversationStep.ASK_TIME;
                    state.selectedTime = undefined; // Clear only the time
                    ConversationService.updateState(state);

                    // Show available slots for the same service and date
                    const serviceName = getServiceDisplayName(state.selectedService!);
                    const availableSlots = BusinessRules.getAvailableSlots(state.selectedDate!);
                    const slotsDisplay = availableSlots.slice(0, 3).map(s => `• ${s}`).join('\n');
                    return `No problem 👍 Please choose another time for ${serviceName} on ${state.selectedDate}.\n\nAvailable time slots:\n${slotsDisplay}\n...\n\nReply with a time.`;
                } else {
                    return this.getResponse(state);
                }

            case ConversationStep.COMPLETED:
            case ConversationStep.CANCELLED:
                // Auto-reset to START so user can just type "Plumbing" next time
                state.currentStep = ConversationStep.START;
                state.selectedService = undefined;
                state.selectedDate = undefined;
                state.selectedTime = undefined;
                ConversationService.updateState(state);
                return "No problem 👍\nLet me know if you’d like to book another time.";

            default:
                return "";
        }
    }

    private static getResponse(state: ConversationState): string {
        switch (state.currentStep) {
            case ConversationStep.ASK_SERVICE:
                // Read garage services from config (configuration-driven display)
                const serviceList = getServiceListDisplay();
                return `Hi 👋\nI can help you book an appointment.\n\nWhat service do you need?\n${serviceList}\n\nReply with the number.`;


            case ConversationStep.ASK_DATE:
                // Use garage service display name from config
                const serviceName = getServiceDisplayName(state.selectedService!);
                // UX FIX 2: Dynamic future-safe date examples
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const inTwoDays = new Date(today);
                inTwoDays.setDate(today.getDate() + 2);
                return `Great 👍\nWhen would you like to book for ${serviceName}?\n\nYou can reply like:\n• Today\n• Tomorrow\n• In 2 days`;

            case ConversationStep.ASK_TIME:
                const slots = BusinessRules.getAvailableSlots(state.selectedDate!);
                const slotsDisplay = slots.slice(0, 3).map(s => `• ${s}`).join('\n');
                return `Perfect.\n\nAvailable time slots on ${state.selectedDate}:\n${slotsDisplay}\n...\n\nReply with a time.`;


            case ConversationStep.CONFIRMATION:
                // Use garage service display name from config
                const confirmServiceName = getServiceDisplayName(state.selectedService!);
                return `Please confirm your booking 👇\n\nService: ${confirmServiceName}\nDate: ${state.selectedDate}\nTime: ${state.selectedTime}\n\nReply YES to confirm or NO to cancel.`;

            case ConversationStep.COMPLETED:
                return `✅ Your appointment is confirmed!\n\nWe’ll see you on ${state.selectedDate} at ${state.selectedTime}.\nThank you 😊`;

            case ConversationStep.CANCELLED:
                return "No problem 👍\nLet me know if you’d like to book another time.";

            default:
                return "";
        }
    }
}
