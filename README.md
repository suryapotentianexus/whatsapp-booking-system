# Designing and Deploying a Deterministic WhatsApp-First Appointment Booking System

## Overview
This repository contains a production-grade WhatsApp appointment booking system
built using the Meta WhatsApp Cloud API.

The system enables customers to book appointments entirely via WhatsApp while
strictly enforcing business rules such as working hours, slot availability,
and double-booking prevention.

The core philosophy of this project is **deterministic correctness over AI-driven ambiguity**.

---

## Key Features
- Live WhatsApp webhook integration (Meta Cloud API)
- Deterministic state machine–based conversation flow
- Strict working-hours enforcement
- Double-booking prevention
- JSON persistence for bookings and conversations
- Stateless integration layer with idempotent processing
- Production-tested with real WhatsApp messages

---

## Architecture Summary
- **Runtime:** Node.js + TypeScript
- **API Layer:** Express (Webhook Receiver)
- **Core Logic:** Finite State Machine (FSM)
- **Persistence:** JSON file storage (MVP-grade, restart-safe)
- **Messaging:** Meta WhatsApp Cloud API
- **Design Principle:** Rule-based, auditable, predictable

---

## Why No AI / NLP?
Appointment booking is a correctness-critical domain.
This system intentionally avoids AI or probabilistic NLP for core logic to ensure:
- Predictable outcomes
- Easy debugging
- Auditable business behaviour
- Zero hallucinations

AI can be layered later for **non-critical UX improvements**, not core decisions.

---

## Live Booking Flow
1. User sends **"Hi"** on WhatsApp
2. Selects service
3. Selects date and time
4. Confirms booking
5. Receives confirmation instantly

All steps are validated through strict business rules.

---

## Project Status
✅ WhatsApp webhook integration complete  
✅ End-to-end booking flow verified  
✅ Persistence across restarts confirmed  
✅ Production-ready MVP  

---

## Detailed Case Study
A complete technical case study explaining design decisions, trade-offs,
architecture, and future roadmap is available here:

👉 **CASE_STUDY.md**

---

## Future Roadmap
- Database-backed persistence (PostgreSQL / Redis)
- Appointment reminder notifications
- Multi-business support
- Configurable services & durations
- Optional AI layer for conversational flexibility
