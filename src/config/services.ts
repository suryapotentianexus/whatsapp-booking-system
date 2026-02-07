import { ServiceType } from '../types';

/**
 * Garage Service Configuration
 * 
 * This configuration file defines the garage-specific services
 * without modifying the core ServiceType enum or business logic.
 * 
 * Integration Boundary:
 * - MessageHandler reads this config for display purposes only
 * - KeywordDetector remains unchanged
 * - ServiceType enum values remain for backward compatibility
 */

export interface GarageService {
    id: ServiceType;
    displayName: string;
    keywords: string[];
    emoji: string;
}

export const GARAGE_SERVICES: GarageService[] = [
    {
        id: ServiceType.PLUMBING,
        displayName: 'Oil Change',
        keywords: ['oil', 'oil change', '1'],
        emoji: '🛢️'
    },
    {
        id: ServiceType.ELECTRICAL,
        displayName: 'Tyre Replacement',
        keywords: ['tyre', 'tire', 'wheel', 'tyre replacement', '2'],
        emoji: '🚗'
    },
    {
        id: ServiceType.INSPECTION,
        displayName: 'General Inspection',
        keywords: ['inspection', 'check', 'general', 'general inspection', '3'],
        emoji: '🔧'
    },
    {
        id: ServiceType.PLUMBING, // Reusing enum value for 4th service
        displayName: 'Brake Check',
        keywords: ['brake', 'brakes', 'brake check', '4'],
        emoji: '🛑'
    }
];

/**
 * Get formatted service list for display in WhatsApp messages
 */
export function getServiceListDisplay(): string {
    return GARAGE_SERVICES
        .slice(0, 3) // Display first 3 services (matching original flow)
        .map((service, index) => `${index + 1}️⃣ ${service.displayName}`)
        .join('\n');
}

/**
 * Get service display name by ServiceType
 */
export function getServiceDisplayName(serviceType: ServiceType): string {
    const service = GARAGE_SERVICES.find(s => s.id === serviceType);
    return service ? service.displayName : serviceType;
}
