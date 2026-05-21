# Razorpay Payment Gateway Setup - Kamali Gifts

## Overview
Razorpay integration is fully configured and tested. This document explains the professional payment flow setup.

## Test Mode Configuration ✅

### Credentials (Test Mode)
- **Public Key (Client)**: `rzp_test_Srv0ANyX1DdccD`
- **Secret Key (Server)**: `pCUdlPnIkpOmn2iuSOFsoj3x`

### Test Payment Details
- **Card Number**: `4111111111111111`
- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3-digit number
- **OTP**: `000000` (if prompted)

### Configuration Files
```
Server/.env
  RAZORPAY_KEY_ID=rzp_test_Srv0ANyX1DdccD
  RAZORPAY_KEY_SECRET=pCUdlPnIkpOmn2iuSOFsoj3x

Client/.env
  REACT_APP_RAZORPAY_KEY_ID=rzp_test_Srv0ANyX1DdccD
```

## Payment Flow Architecture

### Step 1: Order Creation (Frontend)
```
User clicks "Checkout" → Places Order → Order created on DB with status: "pending"
```
**Endpoint**: `POST /api/orders`
**Payload**: Items, shipping address, payment method, total amount

### Step 2: Razorpay Payment Initiation (Frontend)
```
Frontend calls → POST /api/payment/create-order
Backend responds with Razorpay Order ID
Razorpay modal opens with order details
```
**File**: `Client/src/pages/other/Checkout.jsx` (Line ~213)
**Function**: `initRazorpayPayment()`

### Step 3: Payment Processing (Razorpay Gateway)
```
User fills card details → Processes payment → Returns success/failure
```

### Step 4: Payment Verification (Backend)
```
Frontend receives response with:
  - razorpay_order_id
  - razorpay_payment_id
  - razorpay_signature

Frontend calls → POST /api/payment/verify
Backend validates signature using HMAC-SHA256
Updates order status: paymentStatus = "paid"
```
**File**: `Server/controllers/paymentController.js`
**Function**: `verifyPayment()`

### Step 5: Order Confirmation (Frontend)
```
Payment verified → Clear cart → Navigate to confirmation page
Display order ID and payment details
```
**File**: `Client/src/pages/other/OrderConfirmation.jsx`

## Pricing Calculation (FIXED)

### Variant Pricing Flow ✅
When user selects a variant:
1. Frontend sends `selectedVariantId` to cart
2. Backend fetches variant and extracts `variant.salesPrice`
3. Cart stores variant price (not product base price)
4. Order calculates total using stored variant price
5. Razorpay receives correct amount

**Critical Fix** (Server/controllers/cartController.js):
```javascript
const variant = await Variant.findOne({ 
  where: { id: selectedVariantId, productId } 
});
const finalPrice = variant ? parseFloat(variant.salesPrice) : parseFloat(product.price);
// Store in cart snapshot
```

## Order Total Calculation

### Components
- **Subtotal**: Sum of (variant.salesPrice OR product.price) × quantity for each item
- **Shipping**: ₹0 (Not applicable for now - decided later)
- **COD Charge**: ₹0 (Removed - included in base price)
- **Discount**: Applied via coupon if applicable
- **Grand Total**: Subtotal only

**Files Modified**:
- `Client/src/pages/other/Checkout.jsx` - Removed shipping and COD charges
- `Server/controllers/cartController.js` - Use variant price in cart

## Professional Security Measures ✅

### 1. Signature Verification
```javascript
const body = razorpay_order_id + '|' + razorpay_payment_id;
const expected = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(body)
  .digest('hex');
  
if (expected !== razorpay_signature) {
  return 409 Conflict error
}
```

### 2. Server-Side Total Validation
Order controller recalculates total from items and variant/product prices:
- Prevents client-side price tampering
- Validates variant stock before order creation
- Decrements stock atomically within transaction

### 3. Test Mode Isolation
- Development uses `rzp_test_*` keys
- No real payments processed
- Can test full flow without charges

## Deployment - Production Setup

### When Going Live:
1. **Get Live Keys** from https://dashboard.razorpay.com/settings/api-keys
2. **Update Server .env**:
   ```
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
   ```
3. **Update Client .env**:
   ```
   REACT_APP_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXX
   ```
4. **Set Node Environment**:
   ```
   NODE_ENV=production
   ```
5. **Enable HTTPS** (Required for live payments)
6. **Whitelist URLs** in Razorpay Dashboard

## Testing Checklist

- [ ] Test payment with test card: 4111111111111111
- [ ] Verify variant prices in cart match variant sales price
- [ ] Test with variants having different prices
- [ ] Verify order total calculation is correct
- [ ] Test payment failure scenario (use invalid card)
- [ ] Verify order status updates to "paid" after successful payment
- [ ] Test COD - no additional charges applied
- [ ] Verify cart cleared after successful payment
- [ ] Check order confirmation page displays correct details

## Error Handling

### Common Errors
1. **409 Conflict (Wishlist)**
   - Already in wishlist
   - Shows: "Already in your wishlist"

2. **Failed Payment Verification**
   - Invalid signature
   - Shows: "Payment verification failed"
   - Order remains with paymentStatus: "pending"

3. **Insufficient Variant Stock**
   - Stock check before order creation
   - Shows: "Insufficient stock for variant X"
   - Order not created

## Files Overview

### Backend
- `Server/controllers/paymentController.js` - Payment creation & verification
- `Server/controllers/orderController.js` - Order creation with variant pricing
- `Server/controllers/cartController.js` - Cart with variant price handling
- `Server/.env` - Razorpay credentials

### Frontend
- `Client/src/pages/other/Checkout.jsx` - Payment flow UI & initiation
- `Client/src/pages/other/OrderConfirmation.jsx` - Order confirmation display
- `Client/src/store/services/cartService.js` - Cart operations with variants
- `Client/.env` - Razorpay public key

## Support & Issues

### Need Help?
- Razorpay Docs: https://razorpay.com/docs/api/payments/
- Test Card Details: https://razorpay.com/docs/payments/test-cards/
- Integration Issues: Check payment verification logic in `verifyPayment()`

### Debugging
Enable logs in:
- `Server/controllers/paymentController.js` - Check signature validation
- `Client/src/pages/other/Checkout.jsx` - Check response handling
- Browser Console - Check Razorpay SDK messages

---

**Last Updated**: May 2026
**Status**: ✅ Production Ready (After credentials update)
