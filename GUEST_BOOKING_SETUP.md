# Guest Booking System - Setup Guide

## Overview
The guest booking system allows users to book car wash services without creating an account. They receive a confirmation code to track and manage their booking.

## Features Implemented

### Frontend
✅ **GuestBooking Component** - Multi-step booking flow with:
- Step 1: Guest information (name, phone, email)
- Step 2: Service selection and vehicle details
- Step 3: Scheduling and confirmation
- Step 4: Success page with confirmation code

✅ **Landing Page Updates** - Added "Book as Guest" buttons:
- Primary CTA in hero section
- Secondary CTA in bottom section

✅ **Services Page Updates** - Added "Book as Guest" option on each service card

### Backend
✅ **API Endpoint** - `/api/guest-bookings` with:
- POST: Create guest booking
- GET: Retrieve booking by confirmation code
- POST: Cancel booking by confirmation code

✅ **Database Migration** - New `guest_bookings` table

## Setup Instructions

### Step 1: Apply Database Migration

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `apps/api/database/migrations/003_create_guest_bookings_table.sql`
4. Paste and run the SQL

#### Option B: Using Command Line (if you have psql)
```bash
psql -h [your-supabase-host] -U postgres -d postgres -f apps/api/database/migrations/003_create_guest_bookings_table.sql
```

#### Verify Migration
Run this query to check if the table was created:
```sql
SELECT * FROM guest_bookings LIMIT 1;
```

### Step 2: Configure Environment Variables

Make sure your `.env` files have the correct API URL:

**Frontend (.env in apps/web/):**
```bash
VITE_API_URL=http://localhost:3000/api
# Or for network access:
VITE_API_URL=http://192.168.1.XXX:3000/api
```

**Backend (.env in apps/api/):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd apps/api
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm install
npm run dev
```

### Step 4: Test Guest Booking Flow

1. Open browser to `http://localhost:5173`
2. Click "Book as Guest" on landing page
3. Fill in your information:
   - Name: John Doe
   - Phone: +971 50 123 4567
   - Email: john@example.com
4. Select a service and vehicle details
5. Choose date/time and submit
6. You should see a confirmation code (e.g., "A3B2C1D4")

## API Endpoints

### Create Guest Booking
```http
POST /api/guest-bookings
Content-Type: application/json

{
  "guest_name": "John Doe",
  "guest_phone": "+971501234567",
  "guest_email": "john@example.com",
  "service_id": "uuid-here",
  "vehicle_info": "Toyota Camry",
  "scheduled_date": "2024-12-31",
  "scheduled_time": "14:00",
  "location_type": "at_location",
  "address": null,
  "notes": "Please use premium wax",
  "total_price": 150
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "id": "uuid",
    "bookingNumber": "GUE123456789",
    "confirmationCode": "A3B2C1D4",
    "scheduledDate": "2024-12-31T14:00:00Z",
    "status": "pending"
  },
  "confirmationCode": "A3B2C1D4"
}
```

### Get Booking by Confirmation Code
```http
GET /api/guest-bookings/confirmation/A3B2C1D4
```

### Cancel Booking
```http
POST /api/guest-bookings/cancel/A3B2C1D4
Content-Type: application/json

{
  "reason": "Changed plans"
}
```

## Database Schema

The `guest_bookings` table includes:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| booking_number | VARCHAR(50) | Unique booking number (GUE...) |
| confirmation_code | VARCHAR(20) | 8-character confirmation code |
| guest_name | VARCHAR(200) | Guest's full name |
| guest_phone | VARCHAR(50) | Guest's phone number |
| guest_email | VARCHAR(255) | Guest's email address |
| service_id | UUID | Reference to services table |
| vehicle_info | VARCHAR(200) | Vehicle make and model |
| scheduled_date | TIMESTAMP | Appointment date/time |
| location_type | VARCHAR(50) | 'at_location' or 'mobile' |
| address | TEXT | Address for mobile service |
| notes | TEXT | Special requests |
| status | VARCHAR(50) | 'pending', 'confirmed', 'completed', 'cancelled' |
| total_price | DECIMAL(10, 2) | Total booking price |
| created_at | TIMESTAMP | Record creation time |

## Security Features

✅ **No Authentication Required** - Public endpoint for booking creation
✅ **Row Level Security (RLS)** - Enabled on guest_bookings table
✅ **Email Validation** - Server-side email format validation
✅ **Unique Codes** - Cryptographically generated confirmation codes
✅ **Status Tracking** - Prevent cancellation of completed bookings

## Next Steps (Optional Enhancements)

### Email Integration
Add email confirmation using the emailService:
```javascript
// In apps/api/src/routes/guest-bookings.js
const emailService = require('../services/emailService');

await emailService.sendGuestBookingConfirmation({
  email: guest_email,
  name: guest_name,
  bookingNumber,
  confirmationCode,
  scheduledDate: scheduledDateTime,
  vehicleInfo: vehicle_info
});
```

### SMS Notifications
Integrate Twilio or similar for SMS confirmations

### Admin Management
Add admin panel view to manage guest bookings:
- View all guest bookings
- Assign staff to guest bookings
- Update booking status
- Contact guests

### Payment Integration
Add Stripe/PayPal for guest payments:
- Pay online at booking time
- Pay on arrival option
- Send payment links via email

## Troubleshooting

### Issue: Services not loading
**Solution:** Check that the services endpoint is accessible:
```bash
curl http://localhost:3000/api/admin/services
```

### Issue: Database connection error
**Solution:** Verify Supabase credentials in .env:
```bash
# Test connection
curl https://your-project.supabase.co/rest/v1/
```

### Issue: Confirmation code not showing
**Solution:** Check browser console for errors. Verify API response in Network tab.

### Issue: CORS errors
**Solution:** Make sure API is configured to allow frontend origin:
```javascript
// In apps/api/src/index.js
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.1.XXX:5173'],
  credentials: true
}));
```

## Files Modified/Created

### New Files
- `apps/web/src/components/GuestBooking.jsx` - Main booking component
- `apps/web/src/components/GuestBooking.css` - Booking styles
- `apps/api/src/routes/guest-bookings.js` - API routes
- `apps/api/database/migrations/003_create_guest_bookings_table.sql` - DB migration
- `GUEST_BOOKING_SETUP.md` - This guide

### Modified Files
- `apps/web/src/App.jsx` - Added guest booking route
- `apps/web/src/pages/LandingPage.jsx` - Added "Book as Guest" CTAs
- `apps/web/src/pages/LandingPage.css` - Updated button styles
- `apps/web/src/pages/Services.jsx` - Added guest booking button
- `apps/web/src/pages/Services.css` - Added button styles
- `apps/api/src/index.js` - Registered guest booking routes

## Success Criteria

✅ Guests can book without creating an account
✅ Confirmation code is generated and displayed
✅ Booking data is saved to database
✅ UI is clean and professional
✅ Mobile responsive design
✅ Smooth multi-step flow
✅ Form validation working
✅ Error handling in place

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the API server logs
3. Verify database migration was applied
4. Ensure environment variables are set correctly
5. Check that services exist in the database
