import * as readline from 'readline';
import { MessageHandler } from './logic/messageHandler';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const PHONE_NUMBER = '1234567890'; // Simulated user

console.log("--- WhatsApp Booking Simulation ---");
console.log("Type 'start' to begin, or just say 'hi'.");
console.log("Type 'exit' to quit simulation.");
console.log("-----------------------------------");

function ask() {
    rl.question('> ', (input) => {
        if (input.trim().toLowerCase() === 'exit') {
            rl.close();
            return;
        }

        const response = MessageHandler.handleMessage(PHONE_NUMBER, input);
        console.log(`\nBot:\n${response}\n`);
        ask();
    });
}

ask();
