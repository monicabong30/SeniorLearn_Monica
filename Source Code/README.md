# SeniorLearn Australia

SeniorLearn is a mobile learning platform for older adults. It supports membership management, classes and enrolments, bulletins, notifications, and role-based administration.

## 1. Project Overview

The mobile app connects to a Node.js HTTPS API. Local Android builds trust the included public SeniorLearn CA, allowing devices on the same local network to connect to the backend without disabling TLS verification.

## 2. Tech Stack

| Component | Technology |
|---|---|
| Mobile | React Native, Expo, Expo Router |
| Backend | Node.js, Express |
| Language | TypeScript |
| Database | MongoDB Atlas, Mongoose |
| Payment | Local DemoPay simulation |
| API documentation | Swagger / OpenAPI |
| Testing | Vitest |
| Android build | Expo EAS Build |

## 3. Installation

Run from the repository root:

```powershell
npm install
```

Create these local environment files from their examples:

- `backend/.env` from `backend/.env.example`
- `mobile/.env` from `mobile/.env.example`

Set `MONGODB_URI` and a long random `JWT_SECRET` in `backend/.env`. Keep environment files and all private certificate material out of version control.

## 4. Environment Setup and Local HTTPS

The backend computer and Android device must be on the same local Wi-Fi or Ethernet network. Find the IPv4 address of the active Wi-Fi or Ethernet adapter on the backend computer:

```powershell
ipconfig
```

In the current PowerShell session, define the API address:

```powershell
$LAN_IP = Read-Host "Enter your backend computer's LAN IPv4 address"
$API_URL = "https://${LAN_IP}:4000/api"
```

Define these variables again in each new PowerShell terminal session. They are not expanded automatically inside `.env` files.

From the repository root, generate the local CA and server certificate:

```powershell
.\backend\scripts\generate-local-certificates.ps1 -LanIp $LAN_IP
```

The server certificate's IP SAN must match `$LAN_IP`. The script creates private key material in `backend/certs/` and copies only the public CA to `mobile/assets/certs/seniorlearn-local-ca.crt` for Android builds. Do not copy private keys into `mobile/`.

If the backend LAN IP changes, replace only the server certificate and retain the existing local CA:

```powershell
.\backend\scripts\generate-local-certificates.ps1 -LanIp $LAN_IP -ReplaceServerCertificate
```

Set these HTTPS values in `backend/.env`:

```dotenv
HOST=0.0.0.0
PORT=4000
HTTPS_ENABLED=true
HTTPS_KEY_PATH=./certs/server.key
HTTPS_CERT_PATH=./certs/server.crt
```

Display the mobile API value, then copy the output into `mobile/.env`:

```powershell
Write-Host "EXPO_PUBLIC_API_URL=$API_URL"
```

```dotenv
EXPO_PUBLIC_API_URL=https://YOUR_LAN_IP:4000/api
```

Replace `YOUR_LAN_IP` with the actual backend computer IPv4 address. The `.env` file must contain the completed value, not `$API_URL` or `${LAN_IP}`.

## 5. Run the Application

Start the backend from `backend/`:

```powershell
cd backend
npm run dev
```

Start the Expo development server from `mobile/` in a separate terminal:

```powershell
cd mobile
npm run start
```

Backend endpoints:

- Health check: `https://<LAN-IP>:4000/health`
- Database readiness: `https://<LAN-IP>:4000/ready`
- API documentation: `https://<LAN-IP>:4000/api-docs`

Verify HTTPS from the repository root without bypassing certificate validation:

```powershell
curl.exe --cacert mobile/assets/certs/seniorlearn-local-ca.crt "https://${LAN_IP}:4000/health"
curl.exe --cacert mobile/assets/certs/seniorlearn-local-ca.crt "https://${LAN_IP}:4000/ready"
```

For an OpenSSL verification, resolve the executable from `PATH` first. If Git for Windows installed OpenSSL elsewhere, substitute its installed executable path.

```powershell
$OpenSsl = (Get-Command openssl -ErrorAction SilentlyContinue).Source
if (-not $OpenSsl) { $OpenSsl = 'C:\Program Files\Git\usr\bin\openssl.exe' }
if (-not (Test-Path $OpenSsl)) { throw 'OpenSSL was not found. Install Git for Windows or OpenSSL.' }
'Q' | & $OpenSsl s_client -connect "${LAN_IP}:4000" -CAfile mobile\assets\certs\seniorlearn-local-ca.crt -verify_return_error -verify_ip $LAN_IP
```

For Expo Web, import `mobile/assets/certs/seniorlearn-local-ca.crt` into the operating system or browser trusted root certification authorities store before using the HTTPS API. Do not bypass browser certificate warnings.

If Windows Firewall blocks the device, allow inbound TCP port `4000` on the Private profile (or allow Node.js on Private networks). Do not disable the firewall globally.

## 6. Seed Demo Database

Script: `backend/src/scripts/seed-demo.ts`

The seed script creates a destructive, demonstration-ready dataset containing:

- 2 administrators, 5 tutors, and 20 members with active, pending, expiring, expired, suspended, Professional, and Honorary membership scenarios
- 29 single classes and 12 recurring series (68 independently enrolable dates)
- Calendar enrolment, full/closed/cancelled/completed class examples
- Enrolments, bulletins, notifications, and demo-only payment history

Preview the target database from `backend/`:

```powershell
cd backend
npm run seed:demo
```

Confirm that `MONGODB_URI` in `backend/.env` points to a dedicated demo database, then configure and apply the seed from `backend/`:

```powershell
$env:DEMO_SEED_PASSWORD = "your-demo-password"
$env:DEMO_SEED_TARGET = "seniorlearn"

npm run seed:demo -- --apply --database seniorlearn --confirm-database seniorlearn
```

| Parameter | Description |
|---|---|
| `DEMO_SEED_PASSWORD` | Shared login password for all demo accounts |
| `DEMO_SEED_TARGET` | Target database name |
| `--apply` | Executes the database seed |
| `--database` | Specifies the target database |
| `--confirm-database` | Explicitly confirms the target database |

Replace `seniorlearn` with the database name in `MONGODB_URI`. The script refuses production mode and requires both database-confirmation arguments. It clears only the selected demo database collections.

> **Warning:** The seed script clears and recreates relevant collections in the target database. Existing data in those collections will be lost. Use it only with a dedicated demo database, never a live production database.

## 7. Build and Test

Run these commands from the repository root:

```powershell
npm run build --workspace=backend
npm run typecheck --workspace=backend
npm run test --workspace=backend

npm run typecheck --workspace=mobile
npm run test --workspace=mobile
```

Run Expo Doctor from `mobile/`:

```powershell
cd mobile
npx expo-doctor
```

Database integration tests require a dedicated `MONGODB_TEST_URI` in `backend/.env.test`.

## 8. Android APK Build

Complete the installation and local HTTPS setup above before building. The existing `production` EAS profile creates an installable APK for `com.seniorlearn.app`, uses the configured EAS project and Android signing credentials, and automatically increments the Android build number.

Set the EAS production environment value from `mobile/` before a cloud build:

```powershell
npx eas-cli env:set production --name EXPO_PUBLIC_API_URL --value "$API_URL" --visibility plaintext --scope project
```

Log in only if the intended Expo account is not already active, then build from `mobile/`:

```powershell
npx eas-cli login
npx eas-cli whoami
npx eas-cli build --platform android --profile production
```

The production profile produces an APK, not an AAB. Download the completed APK using the EAS Build URL printed by the command, transfer it to or download it on the Android device, and install it.

The backend must remain running, MongoDB Atlas must be reachable, and the device must reach the backend on the local network. Expo does not need to run for an installed standalone APK.

Build a new APK after mobile source changes, API base-URL changes, backend LAN-IP changes, Android certificate-trust or public-CA changes, or Android build configuration changes. Ordinary backend or database changes do not require an APK rebuild when API compatibility, URL, and trusted CA remain unchanged.

## 9. Project Structure

```text
seniorlearn/
├── backend/
│   ├── scripts/                 # Local certificate utility
│   ├── src/                     # API, data models, services, seed script, and tests
│   ├── .env.example
│   └── package.json
├── mobile/
│   ├── app/                     # Expo Router screens
│   ├── assets/                  # Application images, flags, and public CA certificate
│   ├── plugins/                 # Android HTTPS configuration plugin
│   ├── src/                     # Shared components, application logic, and tests
│   ├── .env.example
│   ├── app.config.ts
│   ├── eas.json
│   └── package.json
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

## 10. Important Notes

- DemoPay is a local simulated payment workflow. It uses the shared HTTPS API client and has no external payment credentials, webhook, or payment provider.
- Membership reminders are delivered in-app.
- Environment files, credentials, dependencies, and build output are excluded from Git.
- The local network deployment requires a running backend and an active MongoDB Atlas connection.
