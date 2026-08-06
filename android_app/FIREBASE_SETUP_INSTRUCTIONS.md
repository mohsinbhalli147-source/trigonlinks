# Firebase Configuration Setup Instructions

## Android App Firebase Setup

The Android app requires Firebase configuration for push notifications and other Firebase services.

### Steps to Complete Firebase Setup:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project or create a new one

2. **Add Android App**
   - Click "Add app"
   - Select Android
   - Package name: `com.trigonlinks.customer`
   - App nickname: `TrigonLinks Customer App`

3. **Download Configuration File**
   - Download `google-services.json` file
   - Replace `android/app/google-services.json.template` with the downloaded file
   - Rename it to `google-services.json`

4. **Enable Required Services**
   - Enable Cloud Messaging (FCM) for push notifications
   - Enable Authentication if needed
   - Enable Crashlytics for crash reporting

5. **Configuration File Values Needed:**
   - `project_number`: Your Firebase project number
   - `firebase_url`: Your Firebase database URL
   - `project_id`: Your Firebase project ID
   - `storage_bucket`: Your Firebase storage bucket
   - `mobilesdk_app_id`: Your app ID
   - `client_id`: OAuth client ID
   - `current_key`: API key

### After Setup:
- The app will be able to receive push notifications
- Crash reporting will be enabled
- Firebase Analytics will track user behavior

### Contact Information:
- Support Email: support@trigonlinks.com
- Support Phone: +92-300-1234567 (Update with real number)
- WhatsApp: +92-300-1234567 (Update with real number)
