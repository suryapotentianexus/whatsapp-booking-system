import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { MessageHandler } from './logic/messageHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 ENV VARIABLES (EXACT NAMES)
const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;

// 🚨 Safety check (important)
if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error('❌ Missing WhatsApp env variables');
}

app.use(express.json());

/**
 * Sends a text message back to the user via WhatsApp Cloud API
 */
async function sendWhatsAppMessage(to: string, text: string) {
    try {
        await axios.post(
            `https://graph.facebook.com/v24.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                text: { body: text }
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`[WhatsApp] Sent reply to ${to}`);
    } catch (error: any) {
        console.error('[WhatsApp] Send failed:', error?.response?.data || error.message);
    }
}

/**
 * Main bridge between WhatsApp and deterministic booking logic
 */
async function handleIncomingWhatsAppMessage(phone: string, text: string) {
    console.log(`[Integration] Incoming from ${phone}: "${text}"`);

    // Process through the booking engine
    const responseText = MessageHandler.handleMessage(phone, text);

    // Send response back via WhatsApp
    await sendWhatsAppMessage(phone, responseText);
}

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'alive' });
});

app.post('/webhook', async (req: Request, res: Response) => {
    try {
        const entry = req.body?.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const message = value?.messages?.[0];

        if (!message || message.type !== 'text') {
            return res.sendStatus(200);
        }

        const from = message.from;
        const text = message.text.body;

        // Bridge to booking engine
        await handleIncomingWhatsAppMessage(from, text);

        res.sendStatus(200);
    } catch (error: any) {
        console.error('[Webhook] Processing failed:', error?.message);
        res.sendStatus(200);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
