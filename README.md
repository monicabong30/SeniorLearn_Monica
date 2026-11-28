# SeniorLearn Australia

### Mobile Application Development Project

**Course:** ICT50220 Diploma of Advanced Programming  
**Project:** SeniorLearn Australia — Digital Learning Platform  
**Platform:** Android (React Native & Expo)

## About the Project

SeniorLearn Australia is a mobile application designed to help older adults access learning activities, manage their memberships and stay informed about community activities.

The application allows members to browse and enrol in classes, manage their membership and receive announcements. Tutors can organise and manage their classes, while administrators can oversee members, classes, enrolments and bulletins.

The application features a clean, accessible and user-friendly interface designed to simplify the learning experience.

## Main Features

- **Registration and Authentication** — Account registration, secure login, password management and personal information management.
- **Class Enrolment** — Browse available classes, view class details, enrol in activities and manage enrolments.
- **Membership Management** — View membership status, expiry dates and renewal options.
- **Membership Payments** — Membership activation and renewal through Stripe Checkout in Test Mode.
- **Tutor Functions** — Create, update, cancel and schedule recurring classes, and manage class participants.
- **Bulletins and Notifications** — Receive announcements, class updates and membership reminders.
- **Admin Dashboard** — View membership and class statistics, and manage members, classes, enrolments and bulletins.
- **Role-Based Access Control** — Access application features according to user roles, membership status and permissions.
- **Responsive Interface** — Consistent navigation and layouts designed for a straightforward mobile experience.

## Membership Types

| Membership | Description |
|---|---|
| Standard | Annual membership with paid renewal. |
| Professional | Eligible for free renewal after completing at least six classes within the previous 12 months. Paid renewal is available if the requirements are not met, with the membership reverting to Standard. |
| Honorary | Lifetime membership without renewal requirements. |

An active membership is required to access membership-restricted learning features.

## Technologies Used

| Component | Technology |
|---|---|
| Mobile Application | React Native, Expo Router |
| Programming Language | TypeScript |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| Database Modelling | Mongoose |
| API | REST API |
| Authentication | JSON Web Token (JWT) |
| Secure Token Storage | Expo SecureStore |
| Payment Integration | Stripe Checkout, Stripe Webhooks |
| API Documentation | Swagger / OpenAPI |
| Android Build | Expo EAS Build |
| Testing | Vitest, Expo Go, Android Application Testing |
| Version Control | Git, GitHub |

## Repository Structure

```text
SeniorLearn_Monica/
├── Assessment Documents/
├── Evidence/
├── Source Code/
│   ├── backend/
│   ├── mobile/
│   ├── .gitignore
│   ├── README.md
│   ├── package.json
│   └── package-lock.json
└── README.md
```

| Directory | Description |
|---|---|
| [Assessment Documents](./Assessment%20Documents) | Project documentation, planning report and assessment materials. |
| [Evidence](./Evidence) | Supporting development, testing and deployment evidence. |
| [Source Code](./Source%20Code) | Mobile application, backend API, database models, tests and configuration files. |

## Download the Android Application

The Android APK is available from the GitHub Releases page.

[Download SeniorLearn Android APK](https://github.com/monicabong30/SeniorLearn_Monica/releases/latest)

Download the APK from the **Assets** section and install it on a compatible Android device.

The application requires a running and accessible backend server to use its online features.

## Running the Project

The mobile application and backend are maintained in the `Source Code` directory.

### Prerequisites

- Node.js and npm
- MongoDB Atlas account
- Stripe Test Mode account
- Expo Go or a compatible Android device

### Setup Overview

1. Clone or download the repository.
2. Install the project dependencies.
3. Configure the backend and mobile environment variables using the provided example files.
4. Configure MongoDB Atlas and Stripe Test Mode.
5. Start the backend server.
6. Configure the mobile application to connect to the backend API.
7. Start the mobile application using Expo Go or build the Android APK.

For detailed installation instructions, environment configuration, testing commands and build instructions, refer to the [Source Code README](./Source%20Code/README.md).

## Testing

The project includes automated testing, TypeScript validation and application testing.

Testing covers key functionality, including:

- User registration and authentication
- Membership management and renewal
- Class scheduling and enrolment
- Role-based access control
- Administrative functions
- API and database integration
- Mobile application components

### Latest Source Code Verification

| Check | Result |
|---|---|
| Backend Build | Passed |
| Backend Automated Tests | 24/24 Passed |
| Mobile TypeScript Check | Passed |

Supporting testing and development evidence is available in the [Evidence](./Evidence) directory.

## Security

The application includes security measures such as JWT authentication, secure token storage, role-based access control, input validation and Stripe webhook signature verification.

Sensitive credentials and actual environment configuration files are excluded from the repository. Environment example files are provided for local setup.

## Known Limitations

This application was developed for educational assessment and demonstration purposes.

- Membership payments use Stripe Test Mode. No real financial transactions are processed.
- The backend runs locally rather than on a permanently hosted server.
- Local API communication uses HTTP over a trusted local network.
- The mobile device must be able to access the configured backend server.
- Internet access is required for MongoDB Atlas and Stripe services.
- The downloadable APK reflects the version published in GitHub Releases and may require rebuilding when the source code or backend configuration changes.

## Project Purpose

This project was developed as part of the **ICT50220 Diploma of Advanced Programming** assessment.

It demonstrates mobile application development, REST API implementation, database integration, authentication, membership management, payment integration, software testing, version control and Android application deployment.
