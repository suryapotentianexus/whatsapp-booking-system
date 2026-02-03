import { ConversationState, ConversationStep, ServiceType } from '../types';

export class StateMachine {
    static getNextStep(currentState: ConversationState, input: string): Partial<ConversationState> {
        const step = currentState.currentStep;
        const lowerInput = input.toLowerCase().trim();

        // Global Commands
        if (lowerInput === 'cancel') {
            return { currentStep: ConversationStep.CANCELLED };
        }
        if (lowerInput === 'restart' || lowerInput === 'start') {
            return {
                currentStep: ConversationStep.ASK_SERVICE,
                selectedService: undefined,
                selectedDate: undefined,
                selectedTime: undefined
            };
        }
        // Help command could be handled here or in MessageHandler to provide context-aware help.
        // For now, we'll let MessageHandler handle 'help' to give specific guidance.

        switch (step) {
            case ConversationStep.START:
                return { currentStep: ConversationStep.ASK_SERVICE };

            case ConversationStep.ASK_SERVICE:
                // Validation happens in MessageHandler/KeywordDetector
                // Here we just define the flow: if valid, go to ASK_DATE
                // But StateMachine usually enforces valid transitions.
                // Let's assume the input has been processed/validated by the caller 
                // OR we put the validation logic here?
                // The user said "Message Handling Rules... Every incoming message must be processed based on current_step".
                // And "State Machine... Implement a state-based conversation system".

                // Let's keep StateMachine pure: it takes the *result* of processing?
                // Or it takes the raw input?
                // "Map input to service... If invalid -> re-ask"

                // I'll make StateMachine helper to determine NEXT step assuming success, 
                // but the actual validation logic might be better in MessageHandler or a separate Validator.
                // However, for a simple MVP, putting transition logic here is fine.

                return { currentStep: ConversationStep.ASK_DATE };

            case ConversationStep.ASK_DATE:
                return { currentStep: ConversationStep.ASK_TIME };

            case ConversationStep.ASK_TIME:
                return { currentStep: ConversationStep.CONFIRMATION };

            case ConversationStep.CONFIRMATION:
                if (lowerInput === 'yes' || lowerInput === 'y') {
                    return { currentStep: ConversationStep.COMPLETED };
                }
                if (lowerInput === 'no' || lowerInput === 'n') {
                    return { currentStep: ConversationStep.CANCELLED };
                }
                return { currentStep: ConversationStep.CONFIRMATION }; // Stay if unclear

            case ConversationStep.COMPLETED:
            case ConversationStep.CANCELLED:
                // If user types again, maybe restart?
                return {
                    currentStep: ConversationStep.ASK_SERVICE,
                    selectedService: undefined,
                    selectedDate: undefined,
                    selectedTime: undefined
                };

            default:
                return { currentStep: ConversationStep.START };
        }
    }
}
