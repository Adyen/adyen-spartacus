# Adyen Partial Payment Implementation for Spartacus

This document describes the implementation of partial payment functionality in the Adyen Spartacus storefront, allowing customers to pay for orders using multiple payment methods such as gift cards combined with credit cards.

## Overview

The partial payment feature enables customers to:
- Use gift cards to pay for part of their order
- Complete the remaining payment with another payment method (credit card, etc.)
- See real-time balance updates and remaining amounts during checkout

## Architecture

### Core Components

1. **Models** (`src/core/models/occ.order.models.ts`)
   - Extended existing models with partial payment fields
   - Added new interfaces: `GiftCardBalanceRequest`, `GiftCardBalanceResponse`, `PartialPaymentOrderRequest`, `PartialPaymentOrderResponse`, `PaymentState`

2. **Services**
   - **`AdyenPartialPaymentService`** (`src/service/adyen-partial-payment.service.ts`)
     - Manages partial payment state and logic
     - Handles gift card balance checks and partial payment order creation
     - Provides callback methods for Adyen DropIn integration
   
   - **Updated `AdyenOrderService`** (`src/service/adyen-order.service.ts`)
     - Extended to support partial payment ID in order requests

3. **Connectors and Adapters**
   - **`AdyenPartialPaymentConnector`** (`src/core/connectors/adyen-partial-payment.connector.ts`)
     - Abstract connector for partial payment operations
   
   - **`OccAdyenPartialPaymentAdapter`** (`src/core/occ/adapters/occ-adyen-partial-payment.adapter.ts`)
     - OCC implementation for partial payment API calls
   
   - **Updated `OccAdyenOrderAdapter`** (`src/core/occ/adapters/occ-adyen-order.adapter.ts`)
     - Added gift card balance and partial payment order endpoints

4. **Components**
   - **Updated `CheckoutAdyenPaymentMethodComponent`** (`src/checkout-adyen-payment-method/checkout-adyen-payment-method.component.ts`)
     - Integrated partial payment service
     - Added Adyen DropIn callbacks for balance check and order request
     - Enhanced payment response handling for partial payments

## API Integration

The implementation uses the new OCC endpoints:

### Gift Card Balance Check
```
POST /{baseSiteId}/users/{userId}/carts/{cartId}/adyen/giftcard/balance
```

### Partial Payment Order Creation
```
POST /{baseSiteId}/users/{userId}/carts/{cartId}/adyen/orders/partial-payment
```

## Key Features

### 1. Gift Card Balance Verification
- Validates gift card details (number, PIN)
- Returns available balance and transaction limits
- Generates partial payment ID for session tracking

### 2. Partial Payment Order Creation
- Creates encrypted order data for gift card transactions
- Returns PSP reference for payment tracking
- Links to existing partial payment session

### 3. Payment State Management
- Tracks partial payment ID across payment flow
- Manages payment completion status
- Handles error states and user feedback

### 4. Adyen DropIn Integration
- Configured for partial payment mode
- Shows remaining amounts to customers
- Handles multiple payment method selection

## Payment Flow

### 1. Gift Card Balance Check
```
User enters gift card details
    ↓
handleBalanceCheck() called by DropIn
    ↓
AdyenPartialPaymentService.checkGiftCardBalance()
    ↓
Backend validates card and returns balance + partialPaymentId
    ↓
DropIn displays available balance and allows amount selection
```

### 2. Partial Payment Order Creation
```
User confirms gift card usage amount
    ↓
handleOrderRequest() called by DropIn
    ↓
AdyenPartialPaymentService.createPartialPaymentOrder()
    ↓
Backend creates partial payment order
    ↓
DropIn processes gift card payment
    ↓
Remaining amount displayed for additional payment method
```

### 3. Final Payment Processing
```
User selects additional payment method for remaining amount
    ↓
handlePayment() called with partialPaymentId
    ↓
AdyenOrderService.adyenPlaceOrder() with partial payment context
    ↓
Backend processes final payment
    ↓
Order completed or additional payment required
```

## Configuration

### Adyen DropIn Configuration
The DropIn is configured with partial payment support:

```typescript
{
  isPartialPayment: true,        // Enable partial payment mode
  showRemainingAmount: true,     // Display remaining amount
  showPayButton: true,           // Show pay button
  showRemovePaymentMethodButton: true  // Allow payment method removal
}
```

### Payment Method Configuration
- **Gift Cards**: Basic configuration for gift card support
- **Credit Cards**: Standard configuration with installments support
- **Other Methods**: Configured per payment method requirements

## Error Handling

### Translation Keys
Added comprehensive error messages for partial payment scenarios:
- Gift card validation errors
- Insufficient balance errors
- Partial payment processing errors
- Order creation failures

### Error Recovery
- Automatic DropIn component reset on errors
- User-friendly error messages
- Graceful fallback to standard payment flow

## Security Considerations

1. **Partial Payment ID**: Treated as sensitive session data
2. **Gift Card Details**: Encrypted before transmission
3. **CSRF Protection**: All API calls include CSRF tokens
4. **Order Data**: Encrypted by Adyen before storage

## Module Structure

```
src/
├── core/
│   ├── models/occ.order.models.ts (extended)
│   ├── connectors/adyen-partial-payment.connector.ts
│   ├── occ/adapters/
│   │   ├── occ-adyen-partial-payment.adapter.ts
│   │   └── occ-adyen-order.adapter.ts (extended)
│   └── partial-payment/adyen-partial-payment.module.ts
├── service/
│   ├── adyen-partial-payment.service.ts
│   └── adyen-order.service.ts (extended)
├── checkout-adyen-payment-method/
│   └── checkout-adyen-payment-method.component.ts (extended)
└── assets/translations/en/payment-errors.ts (extended)
```

## Usage

The partial payment functionality is automatically available when:
1. The backend supports the new OCC endpoints
2. Gift card payment methods are configured in Adyen
3. The Spartacus storefront includes this implementation

No additional configuration is required on the frontend side.

## Testing

### Unit Testing
- Test partial payment service methods
- Mock API responses for different scenarios
- Verify state management and error handling

### Integration Testing
- Test complete partial payment flows
- Verify API endpoint integration
- Test error scenarios and recovery

### E2E Testing
- Test user journey with gift cards
- Verify UI updates during partial payment
- Test payment completion flows

## Future Enhancements

1. **Multiple Gift Cards**: Support for multiple gift card payments in a single transaction
2. **Partial Payment History**: Display previous partial payments in order history
3. **Enhanced Error Messages**: More specific error handling and user guidance
4. **Payment Method Prioritization**: Smart ordering of payment methods based on user preferences
5. **Analytics Integration**: Track partial payment usage patterns and success rates

## Troubleshooting

### Common Issues
1. **Partial Payment ID not persisting**: Check service injection and state management
2. **Balance check failures**: Verify API endpoint configuration and network connectivity
3. **Order creation errors**: Check backend partial payment support and API responses
4. **UI not updating**: Verify component subscription to payment state changes

### Debug Information
- Check browser network tab for API calls to partial payment endpoints
- Monitor console for error messages from partial payment service
- Verify `partialPaymentId` in component state during payment flow
- Check Adyen DropIn configuration for partial payment settings