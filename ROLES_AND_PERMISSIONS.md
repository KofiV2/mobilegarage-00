# 🔐 Roles and Permissions Documentation

## In and Out Car Wash System - Role-Based Access Control (RBAC)

**Last Updated**: December 29, 2024
**Version**: 2.0.0

---

## 📋 Table of Contents

1. [Role Overview](#role-overview)
2. [Permissions Matrix](#permissions-matrix)
3. [API Endpoints by Role](#api-endpoints-by-role)
4. [Test Users](#test-users)
5. [Authentication Flow](#authentication-flow)
6. [Security Features](#security-features)

---

## 🎭 Role Overview

The system has **3 main roles** with hierarchical permissions:

| Role | Level | Description | User Count (Typical) |
|------|-------|-------------|---------------------|
| **Customer** | 1 | Standard user who books services | Unlimited |
| **Staff** | 2 | Employee who manages bookings and services | 5-50 |
| **Admin** | 3 | Full system administrator | 1-5 |

**Permission Hierarchy**: `Admin > Staff > Customer`

---

## 📊 Permissions Matrix

### Complete Permissions Table

| Feature/Resource | Customer | Staff | Admin | Notes |
|-----------------|----------|-------|-------|-------|
| **Authentication** |
| Register Account | ✅ | ✅ | ✅ | Public endpoint |
| Login | ✅ | ✅ | ✅ | Public endpoint |
| Logout | ✅ | ✅ | ✅ | Authenticated users |
| View Own Profile | ✅ | ✅ | ✅ | Own data only |
| Update Own Profile | ✅ | ✅ | ✅ | Own data only |
| Delete Own Account | ✅ | ✅ | ❌ | Admin must delete |
| **Email & Security** |
| Send Verification Email | ✅ | ✅ | ✅ | Own email |
| Verify Email | ✅ | ✅ | ✅ | Own account |
| Request Password Reset | ✅ | ✅ | ✅ | Public endpoint |
| Reset Password | ✅ | ✅ | ✅ | With valid token |
| Enable 2FA | ✅ | ✅ | ✅ | Own account |
| Disable 2FA | ✅ | ✅ | ✅ | Own account |
| Verify 2FA Code | ✅ | ✅ | ✅ | During login |
| **User Management** |
| View All Users | ❌ | ❌ | ✅ | Admin only |
| View User Details | ❌ | ❌ | ✅ | Admin only |
| Create User | ❌ | ❌ | ✅ | Admin can create staff |
| Update Any User | ❌ | ❌ | ✅ | Admin only |
| Delete Any User | ❌ | ❌ | ✅ | Admin only |
| Change User Role | ❌ | ❌ | ✅ | Admin only |
| View User Statistics | ❌ | ❌ | ✅ | Admin only |
| **Bookings** |
| Create Own Booking | ✅ | ✅ | ✅ | All users |
| View Own Bookings | ✅ | ✅ | ✅ | Own bookings |
| View All Bookings | ❌ | ✅ | ✅ | Staff & Admin |
| Update Own Booking | ✅ | ❌ | ❌ | Before confirmed |
| Update Any Booking | ❌ | ✅ | ✅ | Staff & Admin |
| Cancel Own Booking | ✅ | ❌ | ❌ | Customer only |
| Cancel Any Booking | ❌ | ✅ | ✅ | Staff & Admin |
| Assign Booking to Staff | ❌ | ✅ | ✅ | Staff & Admin |
| Change Booking Status | ❌ | ✅ | ✅ | Staff & Admin |
| View Booking History | ✅ | ✅ | ✅ | Own or all |
| **Services** |
| View All Services | ✅ | ✅ | ✅ | Public data |
| View Service Details | ✅ | ✅ | ✅ | Public data |
| Create Service | ❌ | ❌ | ✅ | Admin only |
| Update Service | ❌ | ❌ | ✅ | Admin only |
| Delete Service | ❌ | ❌ | ✅ | Admin only |
| Activate/Deactivate Service | ❌ | ❌ | ✅ | Admin only |
| **Vehicles** |
| Add Own Vehicle | ✅ | ✅ | ✅ | All users |
| View Own Vehicles | ✅ | ✅ | ✅ | Own vehicles |
| View All Vehicles | ❌ | ❌ | ✅ | Admin only |
| Update Own Vehicle | ✅ | ✅ | ✅ | Own vehicles |
| Delete Own Vehicle | ✅ | ✅ | ✅ | Own vehicles |
| **Payments** |
| View Payment Methods | ✅ | ✅ | ✅ | Own methods |
| Add Payment Method | ✅ | ✅ | ✅ | All users |
| Process Payment | ✅ | ✅ | ✅ | For own bookings |
| View Payment History | ✅ | ✅ | ✅ | Own or all |
| Issue Refund | ❌ | ✅ | ✅ | Staff & Admin |
| View All Payments | ❌ | ❌ | ✅ | Admin only |
| **Wallet** |
| View Own Wallet | ✅ | ✅ | ✅ | Own wallet |
| Top Up Wallet | ✅ | ✅ | ✅ | Own wallet |
| View Wallet Transactions | ✅ | ✅ | ✅ | Own transactions |
| Transfer Wallet Funds | ✅ | ✅ | ✅ | P2P transfers |
| View All Wallets | ❌ | ❌ | ✅ | Admin only |
| Adjust Wallet Balance | ❌ | ❌ | ✅ | Admin only |
| View Cashback Statistics | ✅ | ✅ | ✅ | Own stats |
| **Loyalty & Rewards** |
| View Own Loyalty Points | ✅ | ✅ | ✅ | Own points |
| Earn Loyalty Points | ✅ | ✅ | ✅ | On bookings |
| Redeem Loyalty Points | ✅ | ✅ | ✅ | Own points |
| View Loyalty Programs | ✅ | ✅ | ✅ | All users |
| Create Loyalty Program | ❌ | ❌ | ✅ | Admin only |
| Update Loyalty Program | ❌ | ❌ | ✅ | Admin only |
| View Punch Card | ✅ | ✅ | ✅ | Own card |
| Stamp Punch Card | ❌ | ✅ | ✅ | Staff & Admin |
| **Reviews** |
| Create Review | ✅ | ❌ | ❌ | Customers only |
| View Own Reviews | ✅ | ✅ | ✅ | Own reviews |
| View All Reviews | ✅ | ✅ | ✅ | Public data |
| Update Own Review | ✅ | ❌ | ❌ | Within 24 hours |
| Delete Own Review | ✅ | ❌ | ❌ | Within 24 hours |
| Delete Any Review | ❌ | ❌ | ✅ | Admin only |
| Respond to Review | ❌ | ✅ | ✅ | Staff & Admin |
| **Subscriptions** |
| View Subscription Plans | ✅ | ✅ | ✅ | Public data |
| Subscribe to Plan | ✅ | ✅ | ✅ | All users |
| View Own Subscription | ✅ | ✅ | ✅ | Own subscription |
| Cancel Own Subscription | ✅ | ✅ | ✅ | Own subscription |
| Create Subscription Plan | ❌ | ❌ | ✅ | Admin only |
| Update Subscription Plan | ❌ | ❌ | ✅ | Admin only |
| View All Subscriptions | ❌ | ❌ | ✅ | Admin only |
| **Staff Management** |
| View Own Schedule | ❌ | ✅ | ✅ | Staff & Admin |
| Clock In/Out | ❌ | ✅ | ✅ | Staff & Admin |
| View Own Attendance | ❌ | ✅ | ✅ | Staff & Admin |
| View All Staff | ❌ | ❌ | ✅ | Admin only |
| View Staff Attendance | ❌ | ❌ | ✅ | Admin only |
| Manage Staff Shifts | ❌ | ❌ | ✅ | Admin only |
| View Payroll | ❌ | ✅ | ✅ | Own or all |
| Process Payroll | ❌ | ❌ | ✅ | Admin only |
| **Analytics & Reports** |
| View Own Statistics | ✅ | ✅ | ✅ | Personal stats |
| View Service Statistics | ❌ | ✅ | ✅ | Staff & Admin |
| View Revenue Reports | ❌ | ❌ | ✅ | Admin only |
| View Customer Analytics | ❌ | ❌ | ✅ | Admin only |
| Export Reports | ❌ | ❌ | ✅ | Admin only |
| View Dashboard Analytics | ❌ | ✅ | ✅ | Staff & Admin |
| View Advanced Analytics | ❌ | ❌ | ✅ | Admin only |
| **Notifications** |
| Receive Booking Notifications | ✅ | ✅ | ✅ | All users |
| Receive Payment Notifications | ✅ | ✅ | ✅ | All users |
| Receive System Notifications | ✅ | ✅ | ✅ | All users |
| Send Bulk Notifications | ❌ | ❌ | ✅ | Admin only |
| **Settings** |
| Update Own Preferences | ✅ | ✅ | ✅ | All users |
| View System Settings | ❌ | ❌ | ✅ | Admin only |
| Update System Settings | ❌ | ❌ | ✅ | Admin only |
| Manage Integrations | ❌ | ❌ | ✅ | Admin only |

**Legend**:
- ✅ = Permitted
- ❌ = Denied
- 🔒 = Requires additional verification (e.g., 2FA)

---

## 🔌 API Endpoints by Role

### Public Endpoints (No Authentication Required)

```javascript
POST   /api/auth/register              // Register new account
POST   /api/auth/login                 // User login
POST   /api/auth/request-password-reset // Request password reset
POST   /api/auth/reset-password        // Reset password with token
GET    /api/services                   // View all services
GET    /api/services/:id               // View service details
GET    /health                          // Health check
GET    /api                             // API info
GET    /api-docs                        // API documentation
```

### Customer Endpoints (Requires: role='customer')

```javascript
// Profile
GET    /api/auth/me                    // Get own profile
PUT    /api/users/me                   // Update own profile
DELETE /api/users/me                   // Delete own account

// Email & Security
POST   /api/auth/send-verification-email  // Send verification
POST   /api/auth/verify-email          // Verify email
POST   /api/auth/enable-2fa            // Enable 2FA
POST   /api/auth/disable-2fa           // Disable 2FA
POST   /api/auth/verify-2fa            // Verify 2FA code

// Bookings
GET    /api/bookings/my                // View own bookings
POST   /api/bookings                   // Create booking
GET    /api/bookings/:id               // View booking details
PUT    /api/bookings/:id               // Update own booking
DELETE /api/bookings/:id               // Cancel own booking

// Vehicles
GET    /api/vehicles/my                // View own vehicles
POST   /api/vehicles                   // Add vehicle
PUT    /api/vehicles/:id               // Update own vehicle
DELETE /api/vehicles/:id               // Delete own vehicle

// Payments
POST   /api/payments/process           // Process payment
GET    /api/payments/history           // View payment history

// Wallet
GET    /api/wallets/me                 // View own wallet
POST   /api/wallets/topup              // Top up wallet
POST   /api/wallets/confirm-topup      // Confirm Stripe payment
POST   /api/wallets/transfer           // Transfer funds
GET    /api/wallets/transactions       // View transactions

// Loyalty
GET    /api/loyalty/my                 // View loyalty points
POST   /api/loyalty/redeem             // Redeem points
GET    /api/punch-cards/my             // View punch card

// Reviews
POST   /api/reviews                    // Create review
GET    /api/reviews/my                 // View own reviews
PUT    /api/reviews/:id                // Update own review
DELETE /api/reviews/:id                // Delete own review

// Subscriptions
GET    /api/subscriptions/plans        // View plans
POST   /api/subscriptions/subscribe    // Subscribe
GET    /api/subscriptions/my           // View own subscription
DELETE /api/subscriptions/my           // Cancel subscription
```

### Staff Endpoints (Requires: role='staff' or role='admin')

```javascript
// All Customer endpoints PLUS:

// Booking Management
GET    /api/bookings                   // View all bookings
PUT    /api/bookings/:id/status        // Update booking status
PUT    /api/bookings/:id/assign        // Assign booking to staff

// Payments
POST   /api/payments/refund            // Issue refund

// Loyalty
POST   /api/punch-cards/stamp          // Stamp customer card

// Reviews
POST   /api/reviews/:id/respond        // Respond to review

// Staff Operations
POST   /api/staff/clock-in             // Clock in
POST   /api/staff/clock-out            // Clock out
GET    /api/staff/my-schedule          // View own schedule
GET    /api/staff/my-attendance        // View own attendance
GET    /api/staff/my-payroll           // View own payroll

// Analytics
GET    /api/analytics/services         // Service statistics
GET    /api/analytics/dashboard        // Dashboard stats
```

### Admin Endpoints (Requires: role='admin')

```javascript
// All Staff endpoints PLUS:

// User Management
GET    /api/users                      // View all users
GET    /api/users/:id                  // View user details
POST   /api/users                      // Create user
PUT    /api/users/:id                  // Update any user
DELETE /api/users/:id                  // Delete any user
PUT    /api/users/:id/role             // Change user role
GET    /api/users/statistics           // User statistics

// Service Management
POST   /api/services                   // Create service
PUT    /api/services/:id               // Update service
DELETE /api/services/:id               // Delete service
PUT    /api/services/:id/status        // Activate/deactivate

// Booking Administration
DELETE /api/bookings/:id/force         // Force delete booking
GET    /api/bookings/all               // All bookings (admin view)

// Wallet Administration
GET    /api/wallets                    // View all wallets
PUT    /api/wallets/:id/balance        // Adjust balance
GET    /api/wallets/statistics         // Wallet statistics

// Loyalty Administration
POST   /api/loyalty                    // Create loyalty program
PUT    /api/loyalty/:id                // Update loyalty program
DELETE /api/loyalty/:id                // Delete loyalty program

// Staff Management
GET    /api/employees                  // View all employees
POST   /api/employees                  // Create employee
PUT    /api/employees/:id              // Update employee
DELETE /api/employees/:id              // Delete employee
GET    /api/employees/attendance       // All attendance
POST   /api/payroll/process            // Process payroll
GET    /api/payroll/reports            // Payroll reports

// Subscription Management
POST   /api/subscriptions/plans        // Create plan
PUT    /api/subscriptions/plans/:id    // Update plan
DELETE /api/subscriptions/plans/:id    // Delete plan
GET    /api/subscriptions/all          // All subscriptions

// Analytics & Reports
GET    /api/analytics/revenue          // Revenue reports
GET    /api/analytics/customers        // Customer analytics
GET    /api/analytics/advanced         // Advanced analytics
POST   /api/reports/export             // Export reports

// System Settings
GET    /api/settings                   // View settings
PUT    /api/settings                   // Update settings
GET    /api/integrations               // View integrations
PUT    /api/integrations/:id           // Update integration

// Notifications
POST   /api/notifications/broadcast    // Send bulk notifications
```

---

## 👥 Test Users

### Complete Test User Accounts

Use these accounts for testing different role permissions:

| # | Role | Email | Password | First Name | Last Name | Status | 2FA |
|---|------|-------|----------|------------|-----------|--------|-----|
| 1 | **Customer** | customer1@test.com | Test@1234 | John | Doe | Active | ❌ |
| 2 | **Customer** | customer2@test.com | Test@1234 | Jane | Smith | Active | ✅ |
| 3 | **Customer** | customer3@test.com | Test@1234 | Mike | Johnson | Active | ❌ |
| 4 | **Staff** | staff1@test.com | Staff@1234 | Sarah | Williams | Active | ❌ |
| 5 | **Staff** | staff2@test.com | Staff@1234 | David | Brown | Active | ✅ |
| 6 | **Admin** | admin@test.com | Admin@1234 | Admin | User | Active | ✅ |

---

### Detailed Test User Profiles

#### 1️⃣ Customer Test User #1 (Basic Customer)

```json
{
  "email": "customer1@test.com",
  "password": "Test@1234",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1-555-0101",
  "role": "customer",
  "isActive": true,
  "isVerified": true,
  "twoFactorEnabled": false,
  "profile": {
    "address": "123 Main St, Springfield, IL 62701",
    "dateOfBirth": "1990-05-15",
    "preferredLanguage": "en"
  },
  "vehicles": [
    {
      "make": "Toyota",
      "model": "Camry",
      "year": 2020,
      "color": "Silver",
      "licensePlate": "ABC-1234",
      "type": "sedan"
    }
  ],
  "wallet": {
    "balance": 50.00,
    "totalCashbackEarned": 12.50
  },
  "loyaltyPoints": 250,
  "totalBookings": 5,
  "totalSpent": 250.00
}
```

**Use Case**: Regular customer testing
**Test Scenarios**:
- ✅ Create bookings
- ✅ Add/manage vehicles
- ✅ Top up wallet
- ✅ View loyalty points
- ✅ Write reviews
- ❌ Cannot access admin features
- ❌ Cannot view other users

---

#### 2️⃣ Customer Test User #2 (Premium Customer with 2FA)

```json
{
  "email": "customer2@test.com",
  "password": "Test@1234",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1-555-0102",
  "role": "customer",
  "isActive": true,
  "isVerified": true,
  "twoFactorEnabled": true,
  "twoFactorSecret": "JBSWY3DPEHPK3PXP",
  "profile": {
    "address": "456 Oak Ave, Chicago, IL 60601",
    "dateOfBirth": "1985-08-22",
    "preferredLanguage": "en"
  },
  "vehicles": [
    {
      "make": "Honda",
      "model": "Accord",
      "year": 2022,
      "color": "Blue",
      "licensePlate": "XYZ-5678",
      "type": "sedan"
    },
    {
      "make": "BMW",
      "model": "X5",
      "year": 2021,
      "color": "Black",
      "licensePlate": "BMW-9999",
      "type": "suv"
    }
  ],
  "wallet": {
    "balance": 150.00,
    "totalCashbackEarned": 37.50
  },
  "loyaltyPoints": 750,
  "subscription": {
    "plan": "Premium",
    "status": "active",
    "renewalDate": "2025-01-29"
  },
  "totalBookings": 15,
  "totalSpent": 750.00
}
```

**Use Case**: Premium customer with enhanced security
**Test Scenarios**:
- ✅ Test 2FA login flow
- ✅ Multiple vehicles
- ✅ Subscription management
- ✅ Higher wallet balance
- ✅ Premium features

---

#### 3️⃣ Customer Test User #3 (New Customer)

```json
{
  "email": "customer3@test.com",
  "password": "Test@1234",
  "firstName": "Mike",
  "lastName": "Johnson",
  "phone": "+1-555-0103",
  "role": "customer",
  "isActive": true,
  "isVerified": false,
  "twoFactorEnabled": false,
  "vehicles": [],
  "wallet": {
    "balance": 0.00,
    "totalCashbackEarned": 0.00
  },
  "loyaltyPoints": 0,
  "totalBookings": 0,
  "totalSpent": 0.00
}
```

**Use Case**: New user onboarding testing
**Test Scenarios**:
- ✅ Email verification flow
- ✅ First booking experience
- ✅ Add first vehicle
- ✅ First wallet top-up
- ✅ Welcome journey

---

#### 4️⃣ Staff Test User #1 (Basic Staff)

```json
{
  "email": "staff1@test.com",
  "password": "Staff@1234",
  "firstName": "Sarah",
  "lastName": "Williams",
  "phone": "+1-555-0201",
  "role": "staff",
  "isActive": true,
  "isVerified": true,
  "twoFactorEnabled": false,
  "employeeId": "EMP-001",
  "department": "Service",
  "position": "Service Technician",
  "hireDate": "2023-06-01",
  "hourlyRate": 18.50,
  "schedule": {
    "monday": "09:00-17:00",
    "tuesday": "09:00-17:00",
    "wednesday": "09:00-17:00",
    "thursday": "09:00-17:00",
    "friday": "09:00-17:00",
    "saturday": "OFF",
    "sunday": "OFF"
  },
  "assignedBookings": 12,
  "completedBookings": 120,
  "rating": 4.8
}
```

**Use Case**: Staff operations testing
**Test Scenarios**:
- ✅ View assigned bookings
- ✅ Update booking status
- ✅ Clock in/out
- ✅ View own schedule
- ✅ Stamp loyalty cards
- ✅ Issue refunds
- ❌ Cannot access admin features
- ❌ Cannot manage other staff

---

#### 5️⃣ Staff Test User #2 (Senior Staff with 2FA)

```json
{
  "email": "staff2@test.com",
  "password": "Staff@1234",
  "firstName": "David",
  "lastName": "Brown",
  "phone": "+1-555-0202",
  "role": "staff",
  "isActive": true,
  "isVerified": true,
  "twoFactorEnabled": true,
  "twoFactorSecret": "MFRGGZDFMZTWQ2LK",
  "employeeId": "EMP-002",
  "department": "Service",
  "position": "Senior Technician",
  "hireDate": "2022-01-15",
  "hourlyRate": 24.00,
  "schedule": {
    "monday": "08:00-16:00",
    "tuesday": "08:00-16:00",
    "wednesday": "08:00-16:00",
    "thursday": "08:00-16:00",
    "friday": "08:00-16:00",
    "saturday": "08:00-12:00",
    "sunday": "OFF"
  },
  "assignedBookings": 8,
  "completedBookings": 350,
  "rating": 4.9,
  "certifications": ["Premium Detail", "Paint Protection"]
}
```

**Use Case**: Senior staff with additional permissions
**Test Scenarios**:
- ✅ Test 2FA for staff
- ✅ Higher responsibility bookings
- ✅ Extended schedule
- ✅ Certifications

---

#### 6️⃣ Admin Test User (System Administrator)

```json
{
  "email": "admin@test.com",
  "password": "Admin@1234",
  "firstName": "Admin",
  "lastName": "User",
  "phone": "+1-555-0301",
  "role": "admin",
  "isActive": true,
  "isVerified": true,
  "twoFactorEnabled": true,
  "twoFactorSecret": "JBSWY3DPEHPK3PXQ",
  "employeeId": "ADMIN-001",
  "department": "Management",
  "position": "System Administrator",
  "hireDate": "2021-01-01",
  "permissions": ["ALL"],
  "lastLogin": "2024-12-29T10:00:00Z",
  "loginCount": 1247
}
```

**Use Case**: Full system administration
**Test Scenarios**:
- ✅ All admin dashboard features
- ✅ User management (CRUD)
- ✅ Service management
- ✅ Booking management
- ✅ Financial reports
- ✅ System settings
- ✅ Staff management
- ✅ Analytics and reports
- ✅ Bulk operations

---

## 🔐 Authentication Flow

### Standard Login Flow

```
1. POST /api/auth/login
   Body: { email, password }

2. System validates credentials

3. If 2FA enabled:
   → Return: { requiresTwoFactor: true, tempToken }
   → POST /api/auth/verify-2fa
   → Body: { tempToken, code }

4. If 2FA not enabled OR after 2FA verification:
   → Return: { user, token }

5. Store token in localStorage/sessionStorage

6. Add token to Authorization header:
   Authorization: Bearer <token>
```

### Registration Flow

```
1. POST /api/auth/register
   Body: { email, password, firstName, lastName, phone }

2. System creates user with role='customer'

3. Return: { user, token }

4. Email verification sent automatically

5. User receives email with verification link

6. Click link → POST /api/auth/verify-email?token=xxx

7. Account verified → isVerified: true
```

### Password Reset Flow

```
1. POST /api/auth/request-password-reset
   Body: { email }

2. Email sent with reset token (1 hour expiry)

3. User clicks link in email

4. POST /api/auth/reset-password
   Body: { token, newPassword }

5. Password updated → can login with new password
```

---

## 🔒 Security Features

### Token Management

| Feature | Implementation | Expiry |
|---------|---------------|--------|
| **JWT Token** | Bearer token in Authorization header | 7 days (default) |
| **Email Verification Token** | Random 32-byte hex | 24 hours |
| **Password Reset Token** | SHA-256 hashed | 1 hour |
| **2FA Secret** | Base32 encoded | Never (until disabled) |
| **Session Tracking** | Database + Redis | Configurable |

### Rate Limiting

| Endpoint Type | Limit | Window | Behavior |
|--------------|-------|--------|----------|
| **General API** | 100 requests | 15 minutes | 429 Too Many Requests |
| **Authentication** | 5 attempts | 15 minutes | Account lockout warning |
| **Password Reset** | 3 requests | 1 hour | Temporary block |
| **Payment Processing** | 3 requests | 1 minute | Payment freeze |
| **Wallet Top-up** | 10 requests | 1 minute | Suspicious activity flag |

### Account Security

| Feature | Customer | Staff | Admin |
|---------|----------|-------|-------|
| **Password Complexity** | ✅ 6+ chars | ✅ 8+ chars | ✅ 12+ chars |
| **2FA Recommended** | Optional | Recommended | Required |
| **Session Timeout** | 7 days | 3 days | 1 day |
| **Password Expiry** | Never | 90 days | 30 days |
| **Login History** | Last 10 | Last 50 | All |
| **Failed Login Lockout** | 10 attempts | 5 attempts | 3 attempts |

---

## 🧪 Testing Guide

### How to Create Test Users

#### Option 1: Via API (Development)

```bash
# Customer
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer1@test.com",
    "password": "Test@1234",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1-555-0101"
  }'

# Staff (Admin must create and set role)
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff1@test.com",
    "password": "Staff@1234",
    "firstName": "Sarah",
    "lastName": "Williams",
    "phone": "+1-555-0201",
    "role": "staff"
  }'

# Admin (Must be created directly in database or by existing admin)
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin@1234",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+1-555-0301",
    "role": "admin"
  }'
```

#### Option 2: Via Database Seed Script

Create `apps/api/src/scripts/seed-test-users.js`:

```javascript
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../config/supabase');

async function seedTestUsers() {
  const users = [
    {
      email: 'customer1@test.com',
      password: await bcrypt.hash('Test@1234', 10),
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1-555-0101',
      role: 'customer',
      is_active: true,
      is_verified: true
    },
    {
      email: 'staff1@test.com',
      password: await bcrypt.hash('Staff@1234', 10),
      first_name: 'Sarah',
      last_name: 'Williams',
      phone: '+1-555-0201',
      role: 'staff',
      is_active: true,
      is_verified: true
    },
    {
      email: 'admin@test.com',
      password: await bcrypt.hash('Admin@1234', 10),
      first_name: 'Admin',
      last_name: 'User',
      phone: '+1-555-0301',
      role: 'admin',
      is_active: true,
      is_verified: true
    }
  ];

  for (const user of users) {
    const { error } = await supabaseAdmin
      .from('users')
      .insert([user]);

    if (error) {
      console.error(`Error creating ${user.email}:`, error);
    } else {
      console.log(`✅ Created ${user.email}`);
    }
  }
}

seedTestUsers();
```

Run: `node apps/api/src/scripts/seed-test-users.js`

### Testing Role Permissions

```javascript
// Test Customer Access
const customerToken = 'eyJhbGc...'; // From login

// Should succeed
fetch('/api/bookings/my', {
  headers: { Authorization: `Bearer ${customerToken}` }
});

// Should fail (403 Forbidden)
fetch('/api/users', {
  headers: { Authorization: `Bearer ${customerToken}` }
});

// Test Staff Access
const staffToken = 'eyJhbGc...';

// Should succeed
fetch('/api/bookings', {
  headers: { Authorization: `Bearer ${staffToken}` }
});

// Should fail (403 Forbidden)
fetch('/api/users', {
  headers: { Authorization: `Bearer ${staffToken}` }
});

// Test Admin Access
const adminToken = 'eyJhbGc...';

// Should succeed
fetch('/api/users', {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

---

## 📱 Frontend Role-Based Rendering

### Example: Conditional Component Rendering

```jsx
import { useAuth } from './context/AuthContext';

function NavigationMenu() {
  const { user } = useAuth();

  return (
    <nav>
      {/* All users */}
      <Link to="/services">Services</Link>
      <Link to="/bookings">My Bookings</Link>

      {/* Staff & Admin */}
      {['staff', 'admin'].includes(user?.role) && (
        <Link to="/staff-dashboard">Staff Dashboard</Link>
      )}

      {/* Admin only */}
      {user?.role === 'admin' && (
        <>
          <Link to="/admin/dashboard">Admin Dashboard</Link>
          <Link to="/admin/users">Manage Users</Link>
          <Link to="/admin/reports">Reports</Link>
        </>
      )}
    </nav>
  );
}
```

---

## 🔍 Debugging Role Issues

### Common Issues & Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| **403 Forbidden** | Wrong role for endpoint | Check permissions matrix |
| **401 Unauthorized** | Token expired/invalid | Re-login to get new token |
| **Role not updating** | Token cached | Logout and login again |
| **Can't create admin** | No existing admin | Create via database directly |
| **2FA not working** | Wrong secret/code | Regenerate 2FA secret |

### Debug Checklist

```bash
# 1. Verify user role in database
SELECT email, role, is_active FROM users WHERE email = 'test@test.com';

# 2. Decode JWT token (jwt.io)
# Check payload for: userId, role

# 3. Test endpoint directly
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v

# 4. Check server logs
# Look for: "User role: customer" or similar

# 5. Verify middleware is applied
# Check route file for: auth, staffAuth, adminAuth
```

---

## 📞 Support

### Role-Related Questions

**Q: Can I change a customer to staff?**
A: Yes, admin can use `PUT /api/users/:id/role` with `{ "role": "staff" }`

**Q: Can staff create admin accounts?**
A: No, only existing admins can create new admin accounts.

**Q: What happens if 2FA is lost?**
A: Admin can disable 2FA for the user: `PUT /api/users/:id` with `{ "twoFactorEnabled": false }`

**Q: Can users have multiple roles?**
A: No, each user has exactly one role. Roles are hierarchical (Admin > Staff > Customer).

---

**Document Version**: 2.0.0
**Last Updated**: December 29, 2024
**Maintained By**: Development Team
**Next Review**: January 29, 2025
