# SeniorLearn Australia

### Mobile Application Development Project

**Course:** ICT50220 Diploma of Advanced Programming  
**Project:** SeniorLearn Australia — Digital Learning Platform  
**Platform:** Android (React Native & Expo)

## About the Project

SeniorLearn Australia is a mobile application developed to help older adults access learning activities and manage their memberships more easily.

The application allows members to browse available classes, enrol in activities, view announcements and manage their membership information. Tutors can organise their own classes, while administrators can manage members, classes and enrolments.

The aim of this project is to provide a simple and user-friendly learning platform that makes these tasks more convenient.

## Main Features

- **Member Registration and Login** — Users can register, log in and manage their account information.
- **Class Management** — Members can browse classes, view class details and enrol in available activities.
- **Tutor Functions** — Tutors can create, update, cancel and schedule recurring classes.
- **Membership Management** — Members can check their membership status and renew when required.
- **Bulletins and Notifications** — Members can receive announcements and updates about their classes.
- **Admin Dashboard** — Administrators can manage members, classes, enrolments and bulletins.
- **Role-Based Access** — Different functions are available depending on the user's membership type and permissions.

## Technologies Used

| Component | Technology |
|---|---|
| Mobile Application | React Native, Expo Router |
| Programming Language | TypeScript |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| Database Modelling | Mongoose |
| API | REST API |
| Authentication | JWT |
| API Documentation | Swagger / OpenAPI |
| Android Build | Expo EAS Build |
| Testing | Android Studio Emulator, Vitest |

## Project Files

The repository is organised into two main folders:

**Source Code**

Contains the mobile application, backend API, database models and configuration files used to develop SeniorLearn.

**Assessment Documents**

Contains the project documentation, planning report and supporting assessment materials.

## Download the Android Application

The Android APK is available from the GitHub Releases page.

[Download SeniorLearn Android APK](https://github.com/monicabong30/SeniorLearn_Monica/releases/latest)

Download the APK from the **Assets** section and install it on a compatible Android device or emulator.

## Running the Project

The backend and mobile application are maintained in the Source Code folder.

To run the backend locally:

1. Install Node.js and the project dependencies.
2. Configure the required environment variables, including the MongoDB connection string and JWT secret.
3. Start the Express backend.
4. Ensure the mobile application is configured to use the correct backend API address.

The application requires an active backend connection to access online features such as login, class enrolment and membership management.

## Testing

The application was tested using automated tests and the Android Studio Emulator.

The development process included backend unit tests, mobile component tests, API integration tests and Android application testing.

Testing focused on login, class management, enrolment, membership renewal and administrative functions.

## Known Limitations

This version was developed for educational assessment and demonstration purposes.

- Membership payments are simulated. No real financial transactions are processed.
- The backend currently runs locally rather than on a permanently hosted server.
- The tested application uses HTTP for local API communication. HTTPS is not yet implemented.
- Online functions require the configured backend server to be running and reachable.

## Project Purpose

This project was developed as part of the **ICT50220 Diploma of Advanced Programming** assessment.

It demonstrates mobile application development, REST API implementation, database integration, user authentication, testing and Android application deployment.
