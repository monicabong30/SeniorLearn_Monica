# SeniorLearn Australia

SeniorLearn is a React Native/Expo mobile learning platform with an Express, TypeScript, and MongoDB Atlas backend. It supports authentication, role-based learning and administration, classes and enrolments, bulletins, notifications, membership renewal, and membership-expiry enforcement.

## Technology

- Backend: Node.js, Express, TypeScript, Mongoose, MongoDB Atlas, Vitest, Swagger/OpenAPI
- Mobile: Expo, Expo Router, React Native, TypeScript, Vitest
- Android distribution: EAS Build APK (`production` profile)

## Setup

Install the workspace dependencies from the repository root:

```powershell
npm install
```

Create `backend/.env` from `backend/.env.example`. Provide `MONGODB_URI` and `JWT_SECRET`; `PORT` defaults to `4000` and `HOST` defaults to `0.0.0.0`. MongoDB Atlas must be reachable and the URI must target the intended database.

Create `mobile/.env` from `mobile/.env.example`. Set `EXPO_PUBLIC_API_URL` to the backend API address. It is public build-time configuration, so do not put secrets in it.

## Run

```powershell
npm run dev --workspace=backend
npm start --workspace=mobile
```

Backend API documentation is available at `/api-docs` while the server is running.

## Validate

```powershell
npm run build --workspace=backend
npm run typecheck --workspace=backend
npm run test --workspace=backend
npm run typecheck --workspace=mobile
npm run test --workspace=mobile
cd mobile; npx expo-doctor
```

Integration tests require the dedicated `MONGODB_TEST_URI` in `backend/.env.test`; never point it at the demo or production database.

## Demo database

The guarded seed script is `backend/src/scripts/seed-demo.ts`. Review its confirmation and environment safeguards before use, then run:

```powershell
npm run seed:demo --workspace=backend
```

Do not run it against an unintended Atlas database.

## Android APK

The EAS `production` profile builds an internal Android APK. Keep the Android package (`com.seniorlearn.app`), EAS project ID, API URL configuration, logo, and cleartext-traffic plugin unchanged. Configure a reachable local/private-network HTTP API URL in the EAS production environment, then run from `mobile`:

```powershell
npx eas-cli build --platform android --profile production
```

The local Wi-Fi workflow requires the backend laptop to remain online and reachable by the Android device. It is not an HTTPS public deployment.

## Important limitations

Payments are simulated; no payment credentials are collected. Membership reminders are in-app and activity-triggered, not background or email notifications. The repository intentionally excludes local environment files, installed dependencies, build outputs, logs, coverage, and local demo-account credentials.

Assessment evidence and source material remain under `docs/`.
