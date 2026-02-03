import { ConversationState, ConversationStep } from '../types';

export class ConversationService {
    private static states: Map<string, ConversationState> = new Map();

    static getState(phoneNumber: string): ConversationState {
        if (!this.states.has(phoneNumber)) {
            const newState: ConversationState = {
                phoneNumber,
                currentStep: ConversationStep.START,
                updatedAt: new Date()
            };
            this.states.set(phoneNumber, newState);
            return newState;
        }
        return this.states.get(phoneNumber)!;
    }

    static updateState(state: ConversationState): void {
        state.updatedAt = new Date();
        this.states.set(state.phoneNumber, state);
    }
}
