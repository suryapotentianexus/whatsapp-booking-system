import { BusinessRules } from './services/businessRules';
import { Booking, BookingStatus, ServiceType } from './types';

console.log("=== Testing Double Booking Prevention ===\n");

const todayStr = '2026-02-03';
const existingBookings: Booking[] = [
    {
        id: '1',
        service: ServiceType.PLUMBING,
        date: todayStr,
        time: '13:00',
        customerPhone: '123',
        status: BookingStatus.CONFIRMED,
        createdAt: new Date()
    }
];

console.log(`Existing Bookings: 1 confirmed at ${todayStr} 13:00`);

// Test 1: Try booking same slot
console.log(`\nTest 1: Check availability for ${todayStr} 13:00`);
const result1 = BusinessRules.isValidSlot(todayStr, '13:00', existingBookings);
console.log(`Result: ${JSON.stringify(result1)}`);

if (result1.valid === false && result1.reason === 'ALREADY_BOOKED') {
    console.log("✅ PASS: Correctly rejected as ALREADY_BOOKED");
} else {
    console.log("❌ FAIL: Should be ALREADY_BOOKED");
}

// Test 2: Try booking different slot
console.log(`\nTest 2: Check availability for ${todayStr} 14:00`);
const result2 = BusinessRules.isValidSlot(todayStr, '14:00', existingBookings);
console.log(`Result: ${JSON.stringify(result2)}`);

if (result2.valid === true) {
    console.log("✅ PASS: Different slot is valid");
} else {
    // Note: 14:00 must be > now for this to pass independently of past-time logic.
    // If running at 12:15, 14:00 is future.
    console.log("⚠️ CHECK: Slot rejected (reason: " + result2.reason + ")");
}

console.log("\n=== Done ===");
