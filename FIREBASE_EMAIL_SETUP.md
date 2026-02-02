# Firebase Email Notification Setup

## Overview
This guide explains how to configure email notifications for staff orders using Firebase Cloud Functions and Gmail SMTP.

## Prerequisites
1. Firebase CLI installed (`npm install -g firebase-tools`)
2. Firebase project on Blaze (pay-as-you-go) plan (required for external network calls)
3. Gmail account with App Password enabled

## Step 1: Install Firebase Functions Dependencies

```bash
cd functions
npm install
```

## Step 2: Configure Email Credentials

Set the SMTP and owner email configuration using Firebase Functions config:

```bash
# Login to Firebase
firebase login

# Set SMTP configuration
firebase functions:config:set smtp.host="smtp.gmail.com"
firebase functions:config:set smtp.port="587"
firebase functions:config:set smtp.user="kofiv24@gmail.com"
firebase functions:config:set smtp.password="bdyp yvym fuoz ydna"
firebase functions:config:set smtp.from="3ON Car Wash <kofiv24@gmail.com>"

# Set owner notification email
firebase functions:config:set owner.email="kofiv24@gmail.com"
```

> **Note**: Replace the email and password with your actual credentials. The App Password is the 16-character code from your Google Account security settings.

## Step 3: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

## Step 4: Verify Configuration

After deployment, you can test the configuration by calling:
```
https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/testEmailConfig
```

This will show you which config values are set (without exposing actual credentials).

## Step 5: Test Email Notifications

1. Go to `/staff/login` and login with a staff account
2. Submit a test order
3. Check your email for the notification

## Troubleshooting

### "Missing configuration" error
Run `firebase functions:config:get` to verify all values are set.

### Email not sending
1. Ensure your Firebase project is on Blaze plan
2. Verify Gmail App Password is correct (not your regular password)
3. Check Firebase Functions logs: `firebase functions:log`

### Gmail App Password Setup
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification if not already enabled
3. Go to "App passwords" section
4. Generate a new app password for "Mail"
5. Use the 16-character code (with spaces removed) as `smtp.password`

## Local Testing

To test functions locally with the config:
```bash
firebase functions:config:get > .runtimeconfig.json
firebase emulators:start --only functions
```

## Security Notes

- Never commit credentials to git
- Firebase Functions config is encrypted and secure
- App passwords can be revoked anytime from Google Account settings
