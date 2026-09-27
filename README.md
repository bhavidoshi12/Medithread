# MediThread — AI-Enabled Health Memory Timeline Platform

**MediThread** is a production-ready, clinical-grade web platform designed to solve medical record fragmentation. It enables multi-generational households and individual patients to own, structure, and visualize their lifelong health memory with real-time AI assistance, while empowering physicians with high-impact clinical digests.

---

## 🌟 Key Features & Clinical Capabilities

### 1. Multi-Generational Household Dashboard
- Manage up to 5–6 profiles per account (Self, Spouse, Children, Aging Parents).
- **Persistent Emergency Anchor Banner**: Instant visibility of Blood Group, Severe Drug Allergies (e.g. Anaphylactic Penicillin, Peanuts), Emergency Caregiver Contacts, and DNR/Organ Donor directives.
- Real-time profile switching with dedicated health memory histories.

### 2. Chronological Health Memory Timeline
- Vertical interactive chronological spine with high-contrast, category-specific markers:
  - 🔴 **Diagnoses & Clinical Encounters**
  - 🔵 **Lab Reports & Metabolic Panels** (with biomarker trend indicators)
  - 🟢 **Medication Regimens** (with dosage schedules & active statuses)
  - 🟣 **Surgical Procedures & Immunization Boosters**
- Multi-dimensional filtering by Category, Severity, and Free-text Keyword Search.
- Source Document OCR text inspector for full provenance tracking.

### 3. AI Document Ingestion & Structuring Studio
- Drag-and-drop or camera scan simulated intake.
- Real-time 4-stage processing visualizer:
  `[Uploading & Sanitization]` ➔ `[OCR Layout Decomposition]` ➔ `[AI Biomarker Isolation]` ➔ `[Timeline Link]`
- Automatic biomarker parameter extraction (HbA1c, Fasting Glucose, eGFR, Creatinine, LDL/HDL) with reference interval auditing.

### 4. Multi-Context AI Clinical Summary Engine
- **1-Minute Emergency Brief**: Rapid triage overview for paramedics and ER personnel.
- **5-Minute Doctor Consultation Summary**: SOAP-aligned longitudinal synthesis with biomarker trend deltas and differential prompts.
- **Travel Health Passport**: Multilingual medical warning flags (English, Spanish, French) and cryptographically verified immunization proofs.

### 5. Preventive Health Gap Detection Engine
- Clinical guideline scanner based on ADA, USPSTF, CDC, and AAP recommendations.
- Automated alerts for overdue glycemic tests, renal microalbuminuria, lipid panels, and senior/pediatric vaccines.

### 6. Doctor Specialist Portal & Time-Limited Sharing
- Generate encrypted, 24-hour / 7-day access links with custom PIN codes and high-contrast SVG QR codes.
- Specialist review cockpit with parameter correlation graphs, medication interaction audits, and physician clinical notes authoring.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: Modular ES6+ JavaScript, Tailwind CSS (clinical theme with custom slate & glowing accents), Lucide Icons, and Canvas-based longitudinal charting.
- **State Management**: Reactive state store with browser `localStorage` persistence and full CRUD operations.
- **Upload API**: Python server accepts report uploads and stores originals in a configured SharePoint document library through Microsoft Graph. Credentials stay on the server.
- **Database Architecture**: PostgreSQL schema definition in [`db/schema.sql`](db/schema.sql) with Row Level Security (RLS) policies and performance indexes.
- **AI Pipelines**: Real-time simulated OCR & structured entity linking in [`js/ocrPipeline.js`](js/ocrPipeline.js).

---

## 🚀 Quick Start Guide

### Running Locally
To launch the application locally on your machine:

```powershell
# In PowerShell:
py server.py
```

Open `http://localhost:3000` in your browser. Use `py server.py` rather than Python's static `http.server`, because the app's SharePoint upload API is provided by `server.py`.

### Saving Original Reports to SharePoint
The Python server uploads confirmed original files into the configured site's default document library. Uploaders do not sign in to Microsoft; the app uses server-side credentials that are never sent to the browser.

One-time Microsoft setup:

1. Register a **single-tenant** app in Microsoft Entra ID and create a client secret. Keep the secret private and set a reminder to rotate it before it expires.
2. Add Microsoft Graph **Application** permission `Sites.Selected` and have an administrator grant consent.
3. Have a SharePoint administrator grant this app **Write** access to only the destination site. For a Teams channel, use the SharePoint site connected to that Team. Do not grant `Sites.ReadWrite.All` for this integration.
4. Configure these environment variables in the same environment that runs `server.py`:

```powershell
$env:SHAREPOINT_TENANT_ID = "your-tenant-id"
$env:SHAREPOINT_CLIENT_ID = "your-app-client-id"
$secret = Read-Host "SharePoint app secret" -AsSecureString
$env:SHAREPOINT_CLIENT_SECRET = [System.Net.NetworkCredential]::new("", $secret).Password
$env:SHAREPOINT_SITE_URL = "https://contoso.sharepoint.com/sites/Team"
$env:SHAREPOINT_FOLDER_PATH = "General"
py server.py
```

`SHAREPOINT_FOLDER_PATH` is optional and must name an existing folder relative to the default document library; omit it to upload to the library root. For local testing, enter the commands directly in PowerShell; do not commit credentials to this repository. For a deployed app, use the host's secret manager, HTTPS, and a production server rather than exposing the development server.

The anonymous upload endpoint accepts PDF, JPG, PNG, or TXT files up to 25 MB and limits each IP address to 20 uploads per hour. Since uploaders do not authenticate, anyone who can reach the app can submit files to the configured SharePoint folder. This basic limit is not a substitute for production access controls; deploy only in a setting where that access is intended. The app's own sign-up/sign-in screen is separate and remains unchanged. Timeline data still uses this browser's existing `localStorage`.

### Direct Browser Access
Opening `index.html` directly with `file://` does not support SharePoint uploads. Run the Python server and open `http://localhost:3000` instead.
