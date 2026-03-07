# BookMySalon

![BookMySalon Logo](Architecture/logo.png)

BookMySalon is a full-stack salon booking platform built with a Spring Boot backend and React frontend. It supports role-based authentication, salon discovery with maps, bookings, reviews, real-time chat, and notifications.

## Architecture Snapshot

![System Diagram](Architecture/img.png)

## Current Project Status

This repository currently runs as a **monolith + SPA**:

- `bookmysalon-app` (active backend): Spring Boot API, auth, booking, chat, notifications.
- `frontend` (active frontend): React + Vite app for customer, salon owner, and admin flows.

These folders are present but currently **not active runtime services** in this repo state:

- `booking-service`, `category-service`, `gateway-server`, `notification-service`, `payment-service`, `review-service`, `salon-service`, `service-offering-service`, `user-service`, `eureka-server`.

## Implemented Features (From Current Code)

### Authentication and Authorization

- JWT access token + refresh token flow.
- Register and login with email/username and password.
- Signup OTP flow (`initiate`, `resend`, `verify`).
- Forgot password and reset password token flow.
- Optional Google OAuth2 login with backend code-exchange handoff.
- Role-aware routing and dashboards (`CUSTOMER`, `SALON_OWNER`, `ADMIN`).

### Customer Flows

- Browse salons and filter/search by name/city.
- Nearby salon discovery using geolocation + Mapbox map.
- View salon details, services, reviews, and opening hours.
- Create bookings with slot validation and overlap protection.
- Reschedule/cancel bookings from `My Bookings`.
- Review submission with validation.
- Chat with salon owners directly from booking context.

### Salon Owner Flows

- Create first salon from owner console (`/api/salons/me`).
- Manage salon profile, hours, and map location.
- Manage categories and service offerings.
- View salon bookings and update booking status.
- Chat with customers.

### Admin Flow

- Admin dashboard UI aggregates salon/booking/service stats.
- Protected admin backend endpoint: `GET /api/admin/dashboard`.

### Real-Time Messaging

- STOMP over SockJS WebSocket endpoint: `/ws/chat`.
- Conversation management and message history APIs.
- Live message push on `/topic/messages/{conversationId}`.
- User-scoped live notifications on `/user/queue/notifications`.

### Additional Backend APIs

- Pricing estimate (`/api/pricing/estimate`).
- Recommendation API (`/api/recommendations/salons`).
- Analytics APIs (`/api/analytics/*`).
- Retention APIs (`/api/retention/*`).
- Stripe payment link APIs (`/api/payments/*`).

## Tech Stack

### Backend

- Java 21
- Spring Boot 3.5.x
- Spring Security (JWT + OAuth2 client)
- Spring Data JPA
- WebSocket (STOMP/SockJS)
- MySQL connector, H2 (test runtime)
- Stripe SDK, Twilio SDK

### Frontend

- React 18
- React Router 6
- Vite 7
- Tailwind CSS
- Axios
- Framer Motion
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

## Prerequisites

- Java 21
- Maven 3.9+
- Node.js 18+ (Node 20 recommended)
- npm 9+
- MySQL 8/9 running locally

## Local Setup

### 1. Initialize Database

```bash
mysql -u root -p < bookmysalon-app/sql/local-init.sql
```

Optional destructive reset:

```bash
mysql -u root -p < bookmysalon-app/sql/reset-schema.sql
```

### 2. Configure Backend Environment

Create local env values (example file exists at `bookmysalon-app/.env.render.example`).

Minimum required for local backend startup:

```env
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/bookmysalon?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=<your-db-user>
SPRING_DATASOURCE_PASSWORD=<your-db-password>
SECURITY_JWT_SECRET=<base64-secret>
```

Generate a JWT secret (must be Base64 because `JwtService` decodes Base64):

```bash
openssl rand -base64 64
```

### 3. Start Backend

```bash
cd bookmysalon-app
mvn spring-boot:run
```

Backend default URL: `http://localhost:8080`

Health check: `GET /api/auth/health`

### 4. Configure Frontend Environment

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8080
VITE_ENABLE_GOOGLE_OAUTH=false
VITE_MAPBOX_ACCESS_TOKEN=<optional-mapbox-public-token>
VITE_MAPBOX_STYLE_URL=mapbox://styles/mapbox/streets-v12
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL in current code: `http://localhost:3000` (set in `frontend/vite.config.js`).

## Demo Users (Optional)

Enable demo seeding by setting:

```env
APP_DEMO_SEED_USERS=true
```

Seeded accounts (from `DemoUserSeeder`):

- `customer.test@gmail.com` / `Test@12345`
- `owner.test@gmail.com` / `Test@12345`

## Environment Variables Reference

### Backend (`bookmysalon-app/src/main/resources/application.yml`)

Commonly used variables:

- `PORT`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_JPA_HIBERNATE_DDL_AUTO`
- `SPRING_FLYWAY_ENABLED`
- `SECURITY_JWT_SECRET`
- `SECURITY_JWT_ACCESS_TOKEN_EXPIRATION_MS`
- `SECURITY_JWT_REFRESH_TOKEN_EXPIRATION_MS`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `APP_OAUTH2_ENABLED`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_OAUTH2_REDIRECT_URI`
- `APP_OAUTH2_FAILURE_URI`
- `APP_OTP_DEV_MODE`
- `OTP_EMAIL_ENABLED`
- `OTP_EMAIL_FROM`
- `SPRING_MAIL_HOST`
- `SPRING_MAIL_PORT`
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`
- `MSG91_ENABLED`
- `MSG91_AUTHKEY`
- `OTP_SMS_ENABLED`
- `OTP_SMS_DEFAULT_COUNTRY_CODE`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `STRIPE_API_KEY`
- `APP_DEMO_SEED_USERS`

### Frontend (variables used in source code)

- `VITE_API_URL`
- `VITE_ENABLE_GOOGLE_OAUTH`
- `VITE_MAPBOX_ACCESS_TOKEN`
- `VITE_MAPBOX_STYLE_URL`

## API Surface (Highlights)

### Auth and User

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

### Core Domain

- Salons: `/api/salons/*`
- Bookings: `/api/bookings/*`
- Services: `/api/service-offerings/*`
- Categories: `/api/categories/*`
- Reviews: `/api/reviews/*`
- Notifications: `/api/notifications/*` and `/api/chat/notifications`
- Payments: `/api/payments/*`

### Chat and Realtime

- REST: `/api/chat/*`
- WebSocket endpoint: `/ws/chat`
- Message publish destination: `/app/chat.send`
- Message topic: `/topic/messages/{conversationId}`
- User notification queue: `/user/queue/notifications`

### Analytics and Decision APIs

- `/api/analytics/*`
- `/api/pricing/estimate`
- `/api/recommendations/salons`
- `/api/retention/*`

## Deployment

### Backend (Render)

- Uses root `Dockerfile`.
- Render config in `render.yaml`.
- Health check path: `/api/auth/health`.
- Configure environment variables in Render dashboard (do not commit secrets).

### Frontend (Vercel)

- SPA rewrites configured in `frontend/vercel.json`.
- Set production `VITE_API_URL` to backend URL.

## Known Implementation Notes

- Frontend dev port is currently `3000` in `frontend/vite.config.js`.
- `WebSocketConfig` currently allows origin patterns only for `http://localhost:3000` and `http://localhost:5173`; update this for production frontend domains if chat should work cross-origin.
- Payment link creation currently uses a hardcoded Stripe price id and local success redirect URL in backend service code.
- Flyway migration scripts exist, but Flyway is disabled by default (`SPRING_FLYWAY_ENABLED=false`).
- Legacy setup scripts in repo may reference older ports/endpoints; prefer the setup steps in this README.

## Testing and Quality Checks

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

- Keep backend secrets only in backend environment variables.
- Never expose `SECURITY_JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, DB passwords, `STRIPE_API_KEY`, or Twilio auth secrets in frontend `VITE_*` variables.
- `VITE_*` variables are bundled client-side and visible to end users.

## Author

Prahlad Yadav
