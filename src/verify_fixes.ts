import { MessageHandler } from './logic/messageHandler';
import { ConversationService } from './services/conversationService';
import { BookingService } from './services/bookingService';

const PHONE = '8888888888';

function test(input: string, expectedPart: string, description: string) {
    console.log(`\n--- Test: ${description} ---`);
    console.log(`User: ${input}`);
    const response = MessageHandler.handleMessage(PHONE, input);
    console.log(`Bot: ${response}`);

    if (response.toLowerCase().includes(expectedPart.toLowerCase())) {
        console.log('✅ PASS');
    } else {
        console.error(`❌ FAIL: Expected "${expectedPart}"`);
        console.error(`Actual: "${response}"`);
        process.exit(1);
    }
}

console.log('Starting Bug Fix Verification...');

// 1. Test Invalid Time Parsing (25/01 should NOT be 25:00)
// First, select service to get to Date step
test('1', 'When would you like to book', 'Select Service');
// Now input date "25/01"
// It should accept the date, but NOT find a time. So it should ask for TIME.
test('25/01', 'Available time slots', 'Date 25/01 (Should NOT infer time)');

// 2. Test Time Auto-fill (State Persistence)
// We are now in ASK_TIME.
// If we cancel, state should reset.
test('Cancel', 'No problem', 'Cancel Booking');
// Now start new booking with "Tomorrow".
// It should ask for Service first (since we reset to START/ASK_SERVICE implicitly or explicitly)
// Wait, "Tomorrow" is a shortcut. It gives Date.
// If we are in START/CANCELLED, it should reset state.
// So Service=undefined, Date=Tomorrow, Time=undefined.
// It should ask for Service.
test('Tomorrow', 'What service do you need', 'Shortcut "Tomorrow" after cancel (Should ask Service)');

// 3. Test Shortcut in End State
// Let's provide full shortcut
test('Plumbing tomorrow at 10am', 'Please confirm', 'Full shortcut from fresh state');

console.log('\nAll Bug Fixes Verified Successfully');
