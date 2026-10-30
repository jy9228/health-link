# HealthLink — Book a Doctor Consultation

A full-stack patient portal for booking doctor consultations. Built with **Angular 22** (frontend) and **ASP.NET Core 9** (backend).

## Quick Start

You can run this application in two ways. **Option 1 requires no SDK installation.**

### Option 1: Run with Docker (no SDKs needed)

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then:

```bash
docker build -t health-link .
docker run -p 10000:10000 health-link
```

Open **http://localhost:10000** in your browser.

### Option 2: Run Locally (requires SDKs)

**Prerequisites:**
- [.NET SDK 9.0](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js](https://nodejs.org/) v18+ and npm
- Angular CLI (`npm install -g @angular/cli`)

**1. Start the Backend API:**

```bash
cd backend
dotnet run
```

The API will be available at **http://localhost:5146**.

**2. Start the Frontend (in a separate terminal):**

```bash
cd frontend
npm install
ng serve
```

Open **http://localhost:4200** in your browser.

## Project Structure

```
health-link/
├── frontend/                # Angular 22 SPA
│   └── src/app/
│       ├── core/            # Services (DoctorService, ConsultationService)
│       ├── features/
│       │   ├── booking/     # Booking slide-out panel
│       │   ├── consultations/ # List, Card, Detail drawer
│       │   ├── dashboard/   # Statistics cards
│       │   └── doctor-list/ # Doctor list and cards
│       ├── layout/          # Header, Hero Banner
│       └── models/          # TypeScript interfaces
├── backend/                 # ASP.NET Core 9 Web API
│   ├── Controllers/         # DoctorsController, ConsultationsController
│   ├── Models/              # Doctor, Consultation, Enums
│   ├── DTOs/                # CreateConsultationRequest, DashboardStatistics
│   └── Services/            # DataStore (JSON persistence), ConsultationStatusUpdater
├── Dockerfile               # Multi-stage build for production deployment
└── README.md
```

## API Endpoints

| Method | Route                          | Description                                    |
|--------|--------------------------------|------------------------------------------------|
| GET    | /api/doctors                   | List doctors (search, specialty, availability)  |
| GET    | /api/doctors/:id               | Get a specific doctor                          |
| POST   | /api/consultations             | Create a consultation (idempotency supported)  |
| GET    | /api/consultations             | List consultations (search, status, sort)       |
| GET    | /api/consultations/statistics  | Dashboard statistics                           |
| PATCH  | /api/consultations/:id/cancel  | Cancel a scheduled consultation                |

### Query Parameters

**GET /api/doctors**
- `search` — Filter by name or specialty (partial match)
- `specialty` — Filter by exact specialty
- `isAvailable` — Filter by availability (true/false)

**GET /api/consultations**
- `patientName` — Filter by patient name
- `status` — Filter by status (Scheduled, Completed, Cancelled)
- `search` — Search by doctor name
- `sortOrder` — Sort by preferred time (`asc` or `desc`, default `desc`)

**PATCH /api/consultations/:id/cancel**
- `patientName` — Required. Must match the patient who booked (403 otherwise)

## Features

- **Dashboard Statistics** — Live stats cards showing available doctors, upcoming and completed consultations
- **Doctor List** — Browse doctors with search by name/specialty and filter by specialty category
- **Book Consultation** — Slide-out panel with date picker, selectable time slot buttons (30-min intervals, 9 AM–9:30 PM), and consultation type toggle (Chat / Video Call)
- **My Consultations** — View consultations with search, status filter chips (All / Scheduled / Completed / Cancelled), and sort toggle (Newest / Oldest)
- **Consultation Details** — Click any consultation to view full details in a side drawer
- **Cancel Consultation** — Cancel scheduled consultations with confirmation dialog and backend authorization
- **Dynamic Doctor Availability** — Doctors are automatically marked unavailable when all 25 daily time slots are booked
- **Auto-Complete Consultations** — Background service runs every 60 seconds and marks consultations as completed after the 30-minute slot ends
- **Data Persistence** — JSON file storage (`backend/data/healthlink-data.json`) preserves all data across backend restarts; falls back to seed data if no file exists
- **Duplicate Prevention** — Idempotency keys and slot conflict detection (HTTP 409) prevent double bookings
- **Avatar Fallback** — Doctor avatars display URL images with initials fallback when the image fails to load
- **Responsive Layout** — Two-column grid that stacks on mobile (768px breakpoint)

## Backend Validation

| Rule                               | Response                |
|------------------------------------|-------------------------|
| Doctor not found                   | 400 Bad Request         |
| Doctor not available               | 400 Bad Request         |
| Preferred time in the past         | 400 Bad Request         |
| Time slot already booked           | 409 Conflict            |
| Cancel — patient name mismatch     | 403 Forbidden           |
| Cancel — not in Scheduled status   | 400 Bad Request         |
| Duplicate idempotency key          | 200 OK (returns existing) |

## Docker Details

The Dockerfile uses a multi-stage build:

1. **Node 22** — Builds the Angular frontend into static files
2. **.NET 9 SDK** — Publishes the ASP.NET Core backend
3. **.NET 9 Runtime** — Runs the backend and serves the frontend via static files

When running via Docker, the Angular app is served as static files from the backend's `wwwroot/` folder, so both the API and frontend are available on a single port.

## Tech Stack

| Layer    | Technology                |
|----------|---------------------------|
| Frontend | Angular 22, SCSS          |
| Backend  | ASP.NET Core 9, C#        |
| Storage  | JSON file persistence     |
