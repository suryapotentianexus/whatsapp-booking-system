import { ConversationState } from '../types';
export declare class ConversationService {
    private static states;
    static getState(phoneNumber: string): ConversationState;
    static updateState(state: ConversationState): void;
}
//# sourceMappingURL=conversationService.d.ts.map