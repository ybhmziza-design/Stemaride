# THE RIDE 2026 — Ride • Skate • Walk
**A Fun Day of Adventure, Movement and Memories!**
📅 **Date:** Saturday, 21st November 2026  
📍 **Venue:** Nairobi (Announced per category route)

---

## 🚀 Overview

This website is custom-built for **THE RIDE 2026**, directly incorporating all details from the official flyer:
1. **Pricing & Categories**:
   - 🚴 **Cycling:** KSh 700 per person
   - 👥 **Group of 3:** KSh 1,500 (3 participants)
   - ⛸️ **Bike or Skate Hire:** KSh 500 for the day
   - 👟 **Walking:** KSh 500 per person
2. **Dynamic Form Prompts**:
   - The registration form dynamically changes fields based on the selected category:
     - **Cycling:** Prompts for route difficulty (15KM Beginner, 30KM Intermediate, 50KM Challenge) and bicycle arrangement.
     - **Group of 3:** Prompts for Team Name, Participant 2 and Participant 3 names & phone numbers, and activity mix.
     - **Equipment Hire (Bikes or Skates):** Prompts for equipment type (Mountain Bike vs Roller Skates), shoe size (EU 35-46) or bicycle frame size, and safety guard options.
     - **Walking:** Prompts for 5KM Fun Walk vs 10KM Endurance route and pace.
     - **Minor Check:** For participants under 18, prompts for parent/guardian full name, contact phone, and parental consent.
3. **Terms & Conditions**:
   - **Photography Consent Policy:** Mandatory checkbox acknowledging that event photos and videos will be taken and published across official social channels for promotional and community purposes.
   - **Safety First & Helmets:** Mandatory agreement to follow marshals' guidance and wear helmets for cycling and skating.
   - **Payment Policy:** Non-refundable except upon event cancellation.
4. **Paystack Instant Payment & Ticket Download**:
   - Integrated with **Paystack** supporting **M-Pesa (Kenya)**, Debit/Credit Cards, and Bank Transfer in KES.
   - **Instant Ticket Delivery:** The moment payment is authorized by Paystack, the user's ticket is issued in real-time.
   - **1-Click PDF Download:** A dedicated **"📥 DOWNLOAD TICKET (PDF PASS)"** button (powered by `html2pdf.js`) generates and downloads an official high-resolution PDF pass with a unique QR code directly to the participant's device.
   - Configurable Paystack API keys in [`.env`](file:///home/alphakipkorir/Desktop/Stemaride/.env) or via the **Organizer Portal** (`/admin`).
5. **Anti Mix-Up Database & Verification System**:
   - Every registration is saved to SQLite database (`registrations.db`).
   - Generates a unique **Ticket Reference Code** (e.g. `TR26-XGR9L`) with a scannable **QR Code**.
   - **"Find My Registration" Lookup Tool:** Allows any participant to enter their phone number (e.g. `0712345678`) or ticket code to instantly retrieve their registration, preventing lost numbers or gate mix-ups.
   - **Organizer Portal (`/admin`):**
     - Live KPI dashboard (Total registrations, total revenue KSh, gear hire count, minors count, gate check-in count).
     - Search and filter by category, phone number, or Paystack reference.
     - One-click **Gate Check-In** attendance tracking.
     - **Export to CSV / Excel** to carry offline attendee lists.
     - Live Paystack API Key settings management.

---

## 🛠️ How to Run the Website

### Option 1: Using the startup script
```bash
./start.sh
```

### Option 2: Using Python directly
```bash
python3 app.py
```

Then open your browser and go to:
- **Main Website & Registration:** [http://localhost:5000](http://localhost:5000)
- **Organizer Dashboard:** [http://localhost:5000/admin](http://localhost:5000/admin)
- **Sample Digital Ticket:** [http://localhost:5000/ticket/TR26-XGR9L](http://localhost:5000/ticket/TR26-XGR9L)

---

## 📂 Project Structure

```
Stemaride/
├── app.py                  # Flask server with API endpoints, registration logic & CSV export
├── database.py             # SQLite database operations & search queries
├── seed_demo.py            # Demo registration data generator for testing
├── start.sh                # Simple 1-click startup script
├── static/
│   ├── css/style.css       # Custom styles, animations, print stylesheet
│   ├── js/main.js          # Dynamic category prompts, countdown, anti mix-up search, ticket modal
│   ├── js/admin.js         # Admin dashboard table, filter, gate check-in toggle
│   └── images/
│       └── event_poster.jpg # Official THE RIDE poster flyer
├── templates/
│   ├── base.html           # Tailwind CSS base layout with responsive navigation & footer
│   ├── index.html          # Main landing page with dynamic form & lookup tool
│   ├── ticket.html         # Digital pass with QR code and printable receipt
│   ├── admin.html          # Organizer management panel with live table & stats
│   └── 404.html            # Custom error page
└── README.md
```
# Stemaride
