# BookMySalon

![BookMySalon Logo](Architecture/logo.png)

BookMySalon is a full-stack salon booking platform with a Spring Boot backend and React frontend.  
It supports role-based authentication, salon discovery, booking management, reviews, chat, and notifications.

## Project Screenshots

| Preview 1 | Preview 2 | Preview 3 |
| --- | --- | --- |
| ![Project Screenshot 1](bookmysalon-app/src/main/java/com/bookmysalon/ProjectScreenshots/img.png) | ![Project Screenshot 2](bookmysalon-app/src/main/java/com/bookmysalon/ProjectScreenshots/img_1.png) | ![Project Screenshot 3](bookmysalon-app/src/main/java/com/bookmysalon/ProjectScreenshots/img_2.png) |

## Architecture Snapshot

![System Diagram](https://github.com/Prahlad-07/BookMySalon/blob/main/diagram.png)

## Current Project Status

This repository currently runs as a **monolith + SPA**:

- `bookmysalon-app`: Active Spring Boot backend (auth, booking, reviews, chat, notifications, payments).
- `frontend`: Active React + Vite frontend (customer, salon owner, and admin flows).

These folders are present but not active runtime services in the current repo state:

- `booking-service`, `category-service`, `gateway-server`, `notification-service`, `payment-service`
- `review-service`, `salon-service`, `service-offering-service`, `user-service`, `eureka-server`

## Feature Highlights

### Authentication & Authorization

- JWT access + refresh token flow
- Register/login with email and password
- OTP-based signup (`initiate`, `resend`, `verify`)
- Forgot/reset password flow (emails a reset link)
- Change password from account settings (signs out other sessions)
- Rate limiting on login, signup and password-reset endpoints
- Optional Google OAuth2 handoff
- Role-aware routes and dashboards (`CUSTOMER`, `SALON_OWNER`, `ADMIN`)

### Customer Features

- Discover salons with search, city filter, "open now", ratings and nearby search (geolocation + Mapbox)
- Salon pages with a categorised menu, opening hours, rating breakdown and reviews
- Book with a day strip and time-slot picker generated from the salon's hours
- Upcoming / past appointments; reschedule, cancel (with confirmation), book again, leave a review
- Optional Stripe Checkout payments (auto-disabled when no key is set)
- Chat with salons in real time

### Salon Owner Features

- Workspace with an overview of requests needing a reply, upcoming bookings, earnings and rating
- Accept / decline / complete bookings (status changes follow a server-side state machine)
- Menu editor for categories and services
- Salon profile with hours, contact details and map location
- Chat with customers

### Admin Features

- Platform overview: salons, clients, bookings, booked value, revenue chart, booking pipeline,
  top salons and most-booked services (`GET /api/analytics/admin/overview`)

### Realtime Messaging

- STOMP over SockJS endpoint: `/ws/chat`
- Live topic messaging: `/topic/messages/{conversationId}`
- User-specific notifications: `/user/queue/notifications`

### Indian Languages & India Market
- 10 languages: English, हिन्दी, বাংলা, मराठी, తెలుగు, தமிழ், ગુજરાતી, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ.
- Picked automatically from the browser, switchable from the navbar, footer, home page or Account settings; the choice is remembered.
- Each script gets its own Noto Sans/Serif font, loaded only when that language is chosen; Indic text drops Latin-only letter-spacing and uppercase.
- Prices in rupees with Indian grouping (₹1,25,000; ₹2.4L on charts); dates and times follow the chosen language. Stripe charges in INR by default (`STRIPE_CURRENCY`).
- Strings live in `frontend/src/i18n/locales/*.js` (`en.js` is the source; missing keys fall back to English). Translations were drafted in-house — have a native speaker review before a wide launch.

## Demo mode and sample data

The frontend can run without any backend, so the deployed site never shows a broken page.

| `VITE_API_MODE` | Behaviour |
|---|---|
| `auto` (default) | Probes `GET /api/auth/health` for up to 8 s. If the backend answers, everything is live; otherwise the app switches to **demo mode** for that tab. |
| `real` | Always use the backend. |
| `mock` | Always use the in-browser demo API (`npm run dev:demo` / `npm run build:demo`). |

Demo mode:
- Shows a permanent “Demo mode” bar — sample data is never presented as real.
- Serves a snapshot of the real catalogue (`frontend/src/mock/fixtures.json`) plus a generated booking history so dashboards aren’t empty.
- Supports the full flow: browse, search, book, reschedule/cancel, chat, owner workspace, admin overview, sign-up. Everything a visitor creates stays in their browser (`localStorage`) and can be wiped with **Reset demo**.
- Never simulates payments: online checkout is disabled in demo mode.
- Lives entirely in `frontend/src/mock/` and is code-split, so real-mode visitors don’t download it. Route handlers mirror the Spring controllers’ paths and response shapes; refresh the snapshot with `node scripts/export-fixtures.mjs http://localhost:8080 src/mock/fixtures.json` against a running backend.

Backend sample data: set `APP_DEMO_SEED_DATA=true` to seed ~40 salons across 10 Indian cities (verified Unsplash photos, INR menus, opening hours, reviews). Seeding is deterministic and idempotent; demo owner/reviewer accounts get random passwords and can’t be signed into.

## Tech Stack

### Backend

- Java 21
- Spring Boot 3.5.x
- Spring Security (JWT + OAuth2 client)
- Spring Data JPA
- WebSocket (STOMP/SockJS)
- MySQL + H2 (test runtime)
- Stripe SDK, Twilio SDK

### Frontend

- React 19
- React Router 7
- Vite
- Tailwind CSS (design tokens as CSS variables; light + dark themes)
- Axios
- Mapbox GL JS
- STOMP/SockJS clients

## Repository Layout

```text
BookMySalon/
  bookmysalon-app/          # Active Spring Boot backend
    src/main/java/...       # Controllers, services, security, chat, config
    src/main/resources/     # application.yml, optional Flyway migrations
    sql/                    # local DB init/reset scripts
  frontend/                 # Active React frontend
    src/                    # Pages, components, contexts, configs
    vercel.json             # SPA rewrite config
  Architecture/             # Project logo and architecture image
  Dockerfile                # Root backend Docker build (Render-ready)
  render.yaml               # Render deployment manifest
```

## Quick Start (Local)

### 1. Prerequisites

- Java 21
- Maven 3.9+
- Node.js 18+ (Node 20 recommended)
- npm 9+
- MySQL 8/9

### 2. Initialize Database

```bash
mysql -u root -p < bookmysalon-app/sql/local-init.sql
```

Optional destructive reset:

```bash
mysql -u root -p < bookmysalon-app/sql/reset-schema.sql
```

### 3. Configure Backend Environment

Create backend env values (example file: `bookmysalon-app/.env.render.example`).

Minimum local variables:

```env
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/bookmysalon?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=<your-db-user>
SPRING_DATASOURCE_PASSWORD=<your-db-password>
SECURITY_JWT_SECRET=<base64-secret>
APP_FRONTEND_BASE_URL=http://localhost:3000
```

Optional variables:

```env
# Auth abuse protection (defaults shown)
APP_RATE_LIMIT_ENABLED=true
APP_RATE_LIMIT_MAX_REQUESTS=10
APP_RATE_LIMIT_WINDOW_SECONDS=60

# Password-reset / OTP email delivery (falls back to server logs when unset)
OTP_EMAIL_ENABLED=true
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_USERNAME=<smtp-user>
SPRING_MAIL_PASSWORD=<smtp-app-password>
OTP_EMAIL_FROM=<from-address>

# Stripe payments (feature auto-disables when STRIPE_API_KEY is empty)
STRIPE_API_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CURRENCY=usd
```

`APP_FRONTEND_BASE_URL` is used to build password-reset links and Stripe
success/cancel URLs. Point it at your deployed frontend in production.

Generate JWT secret:

```bash
openssl rand -base64 64
```

### 4. Start Backend

```bash
cd bookmysalon-app
mvn spring-boot:run
```

Backend URL: `http://localhost:8080`  
Health check: `GET /api/auth/health`

### 5. Configure and Start Frontend

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8080
VITE_ENABLE_GOOGLE_OAUTH=false
VITE_MAPBOX_ACCESS_TOKEN=<optional-mapbox-public-token>
VITE_MAPBOX_STYLE_URL=mapbox://styles/mapbox/streets-v12
```

Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend dev URL: `http://localhost:3000` (from `frontend/vite.config.js`).

## Demo Users (Optional)

Enable demo users:

```env
APP_DEMO_SEED_USERS=true
```

Seeded accounts (`DemoUserSeeder`):

- `customer.test@gmail.com` / `Test@12345`
- `owner.test@gmail.com` / `Test@12345`
- `admin.test@gmail.com` / `Test@12345`

The sign-in page shows one-click demo buttons; hide them in production with `VITE_SHOW_DEMO_ACCOUNTS=false`.

## API Highlights

### Auth & User

- `GET /api/auth/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/signup/initiate`
- `POST /api/auth/signup/resend-otp`
- `POST /api/auth/signup/verify-otp`
- `POST /api/auth/oauth/exchange`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/user/me`

### Core Domain APIs

- Salons: `/api/salons/*`
- Bookings: `/api/bookings/*`
- Services: `/api/service-offerings/*`
- Categories: `/api/categories/*`
- Reviews: `/api/reviews/*` (one review per customer per salon)
- Notifications: `/api/chat/notifications` (preferred), `/api/notifications/*` (all scoped to the caller)
- Payments (Stripe Checkout):
  - `GET /api/payments/config` — whether online payments are enabled
  - `POST /api/payments/checkout/{bookingId}` — start a hosted checkout for your own booking
  - `POST /api/payments/webhook` — signature-verified Stripe callback (the only path that confirms payment)
  - `GET /api/payments/{id}`, `/user/{userId}`, `/booking/{bookingId}` — ownership-checked reads

### Analytics & Intelligence APIs

- `GET /api/analytics/admin/overview?days=` — platform KPIs, revenue trend, top salons (ADMIN)
- `GET /api/analytics/salon/{salonId}/overview?days=` — per-salon insights (salon owner or ADMIN)
- `GET /api/pricing/estimate?serviceOfferingId=&slot=` — dynamic price estimate
- `GET /api/recommendations/salons?limit=` — personalised salon suggestions for the caller
- `GET /api/retention/coupons/me` — the caller's coupons; `POST /api/retention/coupons`, `GET /api/retention/churn-score` (ADMIN)

## Deployment

### Backend (Render)

- Uses root `Dockerfile`
- Render config in `render.yaml`
- Health endpoint: `/api/auth/health`
- Configure secrets in Render environment variables
- Set `APP_FRONTEND_BASE_URL` to the deployed frontend URL so reset links / payment redirects resolve
- To enable payments, add `STRIPE_API_KEY` + `STRIPE_WEBHOOK_SECRET` and register a Stripe
  webhook endpoint pointing at `https://<backend>/api/payments/webhook`
  (events: `checkout.session.completed`, `checkout.session.expired`)

### Frontend (Vercel)

- SPA rewrites in `frontend/vercel.json`
- Set production `VITE_API_URL` to backend URL
- Add `https://<your-vercel-domain>` to `APP_CORS_ALLOWED_ORIGIN_PATTERNS` on the backend
  (the same value also governs WebSocket origins)

## Testing & Quality Checks

Backend:

```bash
cd bookmysalon-app
mvn test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Security Notes

- Keep backend secrets only in backend environment variables
- Never expose `SECURITY_JWT_SECRET`, DB credentials, Stripe/Twilio/Google secrets in frontend vars
- `VITE_*` variables are bundled client-side and visible to users

## Author

Prahlad Yadav
