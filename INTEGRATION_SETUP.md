# Integration Setup Guide

This document outlines how to set up and configure the payment gateways (Razorpay, Cashfree) and Proxmox infrastructure integration.

## Table of Contents

1. [Admin Authentication Fix](#admin-authentication-fix)
2. [Razorpay Integration](#razorpay-integration)
3. [Cashfree Integration](#cashfree-integration)
4. [Proxmox Integration](#proxmox-integration)
5. [Automatic Recurring Payments](#automatic-recurring-payments)

---

## Admin Authentication Fix

The admin authentication system has been unified to use the `User` model with roles instead of the separate `AdminProfile` table.

### Initialize Admin User

**Option 1: Using Environment Variables**

Set the following in your `.env.local`:

```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="StrongPassword@123"
ADMIN_DISPLAY_NAME="Administrator"
JWT_SECRET="your-32-character-secret-key-here"
```

Then call the initialization endpoint:

```bash
curl -X POST http://localhost:3000/api/admin/init \
  -H "Content-Type: application/json"
```

**Option 2: Using the Seed Script**

```bash
pnpm seed:admin
```

### Login

Navigate to your admin dashboard and use your credentials:

- **Email**: `admin@example.com`
- **Password**: `StrongPassword@123`

### Database Migration

The system supports backward compatibility. Existing `AdminProfile` records will be automatically migrated to the `User` table on first login.

---

## Razorpay Integration

Razorpay is the **recommended** payment gateway for automatic recurring payments and mandates.

### Setup Steps

1. **Create Razorpay Account**
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
   - Sign up or log in
   - Navigate to **Settings > API Keys**

2. **Get API Credentials**
   - Copy your **Key ID** and **Key Secret**
   - Add to `.env.local`:

```env
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your-secret-key-here"
RAZORPAY_MODE="test"  # Use "test" for development, "live" for production
DEFAULT_PAYMENT_GATEWAY="razorpay"
```

3. **Configure Webhooks**

   - In Razorpay Dashboard, go to **Settings > Webhooks**
   - Add webhook URL: `https://yourdomain.com/api/payments/razorpay-webhook`
   - Subscribe to events:
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
     - `mandate.active`
     - `mandate.failed`
     - `recurring.created`
     - `recurring.failed`

4. **Test Webhooks Locally**

   Use a tunneling service like Ngrok:

   ```bash
   ngrok http 3000
   # Then use https://xxxxx.ngrok.io/api/payments/razorpay-webhook as webhook URL
   ```

### Test Cards

| Card Number      | Purpose | Expiry | CVV |
|------------------|---------|--------|-----|
| 4111111111111111 | Success | Any    | Any |
| 4111111111111234 | Decline | Any    | Any |

### API Usage

#### Create a One-Time Payment Order

```javascript
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'product-id-here',
    term: 1,
    gateway: 'razorpay',
    customerDetails: {
      email: 'customer@example.com',
      phone: '+919876543210',
      name: 'John Doe'
    }
  })
})
const data = await response.json()
// Response: { paymentUrl, paymentSessionId, amount, gateway }
```

#### Setup Automatic Recurring Payments (Mandate)

```javascript
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'product-id-here',
    term: 1,
    gateway: 'razorpay',
    setupMandate: true,  // Enable mandate for recurring billing
    customerDetails: {
      email: 'customer@example.com',
      phone: '+919876543210',
      name: 'John Doe'
    }
  })
})
const data = await response.json()
// Response: { mandateUrl, mandateId, mandateStatus, setupMandate: true }
```

---

## Cashfree Integration

Cashfree is an alternative payment gateway. Razorpay is recommended for recurring payments.

### Setup Steps

1. **Create Cashfree Account**
   - Go to [Cashfree Dashboard](https://dashboard.cashfree.com)
   - Sign up or log in

2. **Get API Credentials**
   - Navigate to **Settings > Credentials**
   - Copy **App ID** and **Secret Key**
   - Add to `.env.local`:

```env
CASHFREE_APP_ID="your-app-id-here"
CASHFREE_SECRET_KEY="your-secret-key-here"
CASHFREE_MODE="test"  # Use "test" for sandbox, "production" for live
CASHFREE_WEBHOOK_SECRET="your-webhook-secret"
```

3. **Configure Webhooks**

   - In Cashfree Dashboard, go to **Settings > Webhooks**
   - Add webhook URL: `https://yourdomain.com/api/payments/webhook`
   - Subscribe to payment events

### Test Cards

Same as Razorpay (standard test cards work for both)

### API Usage

```javascript
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'product-id-here',
    gateway: 'cashfree',  // Specify Cashfree
    customerDetails: {
      email: 'customer@example.com',
      phone: '+919876543210'
    }
  })
})
```

---

## Proxmox Integration

Proxmox enables automatic VM provisioning on successful payment.

### Setup Steps

1. **Access Proxmox Console**
   - SSH into your Proxmox server or use the web UI (https://proxmox-host:8006)

2. **Create API Token**

   Via Web UI:
   - Go to **Datacenter > Permissions > API Tokens**
   - Click **Add**
   - Create a token for user `root@pam`
   - Privilege Separation: Unchecked (for full access)
   - Copy the token ID and secret

   Via CLI:
   ```bash
   pveum user add terraform@pve -password <password>
   pveum acl modify / -user terraform@pve -role Administrator
   pveum acltoken add terraform@pve!terraform
   ```

3. **Configure Environment Variables**

```env
PROXMOX_HOST="proxmox.example.com"
PROXMOX_PORT="8006"
PROXMOX_API_TOKEN="root@pam!terraform=your-token-secret"
```

### VM Provisioning Settings

Configure default VM provisioning parameters:

```env
# Default storage for VMs (check with: pvesh get /storage)
PROXMOX_STORAGE="local-lvm"

# Default node for VM creation
PROXMOX_DEFAULT_NODE="pve"
```

### API Usage

The VM provisioning happens automatically when a payment is completed. You can also manually provision:

```javascript
// Manual VM creation endpoint (to be implemented)
const response = await fetch('/api/infrastructure/proxmox/create-vm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'order-id-here',
    customerId: 'customer-id-here',
    hostname: 'vps-customer-01',
    cores: 4,
    memory: 8192, // MB
    storage: 100, // GB
    node: 'pve'
  })
})
```

### VM Management Endpoints

**Get VM Status**
```javascript
const response = await fetch('/api/infrastructure/proxmox/vm/:vmid')
const vm = await response.json()
// Returns: { status, uptime, memory, cpu, ipv4Address, etc }
```

**Stop VM**
```javascript
const response = await fetch('/api/infrastructure/proxmox/vm/:vmid/stop', {
  method: 'POST'
})
```

**Reboot VM**
```javascript
const response = await fetch('/api/infrastructure/proxmox/vm/:vmid/reboot', {
  method: 'POST'
})
```

**Delete VM**
```javascript
const response = await fetch('/api/infrastructure/proxmox/vm/:vmid/delete', {
  method: 'POST'
})
```

---

## Automatic Recurring Payments

### How It Works

1. **Customer Setup Mandate**
   - Customer initiates subscription with `setupMandate: true`
   - Redirected to Razorpay mandate approval page
   - Mandate is activated after customer approval

2. **Automatic Payment Processing**
   - Webhook receives `mandate.active` event
   - System creates recurring payment order
   - Amount charged automatically on schedule (monthly, quarterly, etc.)

3. **Payment Status Tracking**
   - Payment records track mandate ID and status
   - Recurring flag identifies automatic payments
   - Failed payments trigger retry/notification logic

### Database Schema

**Mandate Tracking (razorpay_mandates table)**
```sql
- id: Unique mandate record ID
- mandateId: Razorpay mandate ID
- customerId: Customer reference
- status: "issued" | "pending" | "active" | "failed" | "cancelled"
- amount: Recurring payment amount
- interval: "monthly" | "quarterly" | "halfyearly" | "yearly"
- nextPaymentAt: When next payment will be charged
```

**Payment Records (payments table)**
```sql
- mandateId: Link to mandate (for recurring payments)
- isRecurring: Boolean flag for automatic payments
- status: "pending" | "authorized" | "captured" | "failed" | "refunded"
```

### Error Handling

Failed recurring payments are logged with:
- Payment ID
- Error message
- Timestamp
- Retry count

Implement retry logic or send notifications to customer.

---

## Environment Variables Summary

```env
# ============== Admin Auth ==============
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="StrongPassword@123"
JWT_SECRET="min-32-chars-for-production"

# ============== Payment Gateway ==============
DEFAULT_PAYMENT_GATEWAY="razorpay"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_SECRET="xxxxx"
RAZORPAY_MODE="test"

# Cashfree (Optional)
CASHFREE_APP_ID="xxxxx"
CASHFREE_SECRET_KEY="xxxxx"
CASHFREE_MODE="test"

# ============== Proxmox (Optional) ==============
PROXMOX_HOST="proxmox.example.com"
PROXMOX_PORT="8006"
PROXMOX_API_TOKEN="root@pam!terraform=xxxxx"
```

---

## Troubleshooting

### Admin Login Not Working

1. Check `JWT_SECRET` is set and is at least 32 characters
2. Verify admin user exists in database:
   ```sql
   SELECT * FROM "users" WHERE email = 'admin@example.com' AND role = 'super_admin';
   ```
3. Run initialization: `pnpm seed:admin`

### Razorpay Webhook Not Firing

1. Check webhook URL is public and accessible
2. Verify signature is correct
3. Check logs in Razorpay Dashboard > Settings > Webhooks > Recent Events

### Proxmox Connection Failed

1. Verify `PROXMOX_HOST` is correct
2. Check API token format: `user@realm!tokenid=secret`
3. Test connectivity: `curl -k https://proxmox-host:8006/api2/json/version`

### Payment Not Updating Order Status

1. Check payment webhook is being received
2. Verify `webhookSecret` matches between Razorpay and environment
3. Check database for payment records:
   ```sql
   SELECT * FROM "payments" WHERE "orderId" = 'order-id' ORDER BY "createdAt" DESC;
   ```

---

## Next Steps

1. ✅ Initialize admin user
2. ✅ Set up payment gateway (Razorpay recommended)
3. ✅ Configure webhooks for payment callbacks
4. ✅ (Optional) Set up Proxmox for VM provisioning
5. ✅ Test payment flow in sandbox/test mode
6. ✅ Move to production with live credentials

For more help, check the API documentation or contact support.
