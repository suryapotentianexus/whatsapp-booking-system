import { ConversationState, ConversationStep } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class ConversationService {
    private static states: Map<string, ConversationState> = ConversationService.loadState();
    private static readonly DATA_DIR = path.join(process.cwd(), 'data');
    private static readonly FILE_PATH = path.join(ConversationService.DATA_DIR, 'conversations.json');

    static getState(phoneNumber: string): ConversationState {
        if (!this.states.has(phoneNumber)) {
            const newState: ConversationState = {
                phoneNumber,
                currentStep: ConversationStep.START,
                updatedAt: new Date()
            };
            this.states.set(phoneNumber, newState);
            this.saveState(); // Save new state
            return newState;
        }
        return this.states.get(phoneNumber)!;
    }

    static updateState(state: ConversationState): void {
        state.updatedAt = new Date();
        this.states.set(state.phoneNumber, state);
        this.saveState();
    }

    private static loadState(): Map<string, ConversationState> {
        try {
            const filePath = path.join(process.cwd(), 'data', 'conversations.json');
            if (!fs.existsSync(filePath)) {
                return new Map();
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            const entries = JSON.parse(data) as [string, any][];
            const map = new Map<string, ConversationState>();
            const now = Date.now();
            const ONE_DAY_MS = 24 * 60 * 60 * 1000;

            for (const [phone, rawState] of entries) {
                const updatedAt = new Date(rawState.updatedAt);
                // Expiry check
                if (now - updatedAt.getTime() > ONE_DAY_MS) {
                    map.set(phone, {
                        phoneNumber: phone,
                        currentStep: ConversationStep.START,
                        updatedAt: new Date()
                    });
                } else {
                    map.set(phone, {
                        ...rawState,
                        updatedAt
                    });
                }
            }
            return map;
        } catch (error) {
            console.warn('[Persistence] Failed to load conversations, starting empty:', error);
            return new Map();
        }
    }

    private static saveState(): void {
        try {
            if (!fs.existsSync(this.DATA_DIR)) {
                fs.mkdirSync(this.DATA_DIR, { recursive: true });
            }
            const tempFile = `${this.FILE_PATH}.tmp`;
            const entries = Array.from(this.states.entries());
            fs.writeFileSync(tempFile, JSON.stringify(entries, null, 2), 'utf-8');
            fs.renameSync(tempFile, this.FILE_PATH);
        } catch (error) {
            console.error('[Persistence] Failed to save conversations:', error);
        }
    }
}
