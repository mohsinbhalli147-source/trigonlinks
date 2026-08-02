# TrigonLinks Customer Android App

A native Android application for TrigonLinks PASRUR ISP customers to manage their internet service, view bills, submit complaints, and receive notifications.

## Features

- **Secure Authentication**: Login using Service Name/Username and CNIC
- **Customer Dashboard**: View profile, connection status, package details, billing info
- **Bill Management**: View invoices, download PDFs, payment history
- **Complaint System**: Create, track, and rate support tickets with attachments
- **Push Notifications**: Real-time alerts for bills, complaints, and announcements
- **Offline Support**: Cached data for offline viewing
- **Dark/Light Mode**: User preference theming
- **Material Design**: Modern, responsive UI with smooth animations

## Tech Stack

- **Framework**: Flutter 3.0+
- **Language**: Dart
- **State Management**: Provider
- **Networking**: Dio with interceptors
- **Local Storage**: SharedPreferences + Hive
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Backend**: Existing TrigonLinks ERP APIs

## Prerequisites

- Flutter SDK 3.0+
- Android Studio with Android SDK
- Java JDK 8+
- Firebase account (for push notifications)

## Quick Start

### 1. Install Dependencies
```bash
flutter pub get
```

### 2. Configure Local Properties
Edit `android/local.properties`:
```properties
sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
flutter.sdk=C:\\flutter
```

### 3. Configure Backend API
Edit `lib/config/app_config.dart`:
```dart
static const String baseUrl = 'https://trigonlink.pakdata.net/api';
```

### 4. Firebase Setup (Required for Push Notifications)
1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add Android app with package name: `com.trigonlinks.customer`
3. Download `google-services.json` and place in `android/app/`
4. Enable Cloud Messaging in Firebase Console

### 5. Run the App
```bash
flutter run
```

## Building for Production

### Create Signing Keystore
```bash
keytool -genkey -v -keystore trigonlinks-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias trigonlinks
```

### Configure Signing
1. Copy `android/key.properties.template` to `android/key.properties`
2. Fill in your keystore information

### Build Release APK
```bash
flutter build apk --release
```

### Build Release AAB (for Play Store)
```bash
flutter build appbundle --release
```

## Project Structure

```
lib/
├── config/              # App configuration and themes
├── providers/           # State management (Provider pattern)
├── services/            # API client, storage, notifications
├── screens/             # UI screens
├── utils/               # Constants and utilities
└── main.dart           # App entry point
```

## API Integration

The app uses the existing TrigonLinks ERP backend APIs:
- Authentication: `/api/auth/customer-login`
- Customers: `/api/customers`
- Complaints: `/api/complaints`
- Invoices: `/api/invoices`
- Notifications: `/api/notifications`

## Authentication

Customers log in using:
- **Service Name/Username** (e.g., customer's service identifier)
- **CNIC Number** (13-digit Pakistani national ID)

The app uses JWT tokens with automatic refresh on expiration.

## Complaint Categories

- Internet Down
- Slow Speed
- Billing Issue
- Router Issue
- New Request
- Other

## Documentation

For detailed documentation, see [ANDROID_APP_DOCUMENTATION.md](ANDROID_APP_DOCUMENTATION.md)

## Support

For issues or questions:
- **Backend API**: Contact backend development team
- **Firebase**: Firebase Console support
- **Play Store**: Google Play Console support

## License

Proprietary - TrigonLinks PASRUR ISP

## Version

Current Version: 1.0.0
