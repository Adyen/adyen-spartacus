export const paymentErrors = {
  "adyenPlaceOrderError":{
    "checkout": {
      "error": {
        "authorization": {
          "payment": {
            "refused": "The payment is REFUSED.",
            "detail": {
              "not": {
                "found": "The payment is REFUSED because the saved card is removed. Please try an other payment method."
              }
            }
          },
          "restricted": {
            "card": "The card is restricted."
          },
          "failed": "There was an internal technical error, please choose any other payment method to place your order. If the error persist, please contact us.",
          "cvc": {
            "declined": "The payment is REFUSED. Please check your Card details."
          },
          "pos": {
            "configuration": "Error reaching POS terminal. Check the terminal connection/configuration and try again."
          },
          "transaction": {
            "not": {
              "permitted": "The transaction is not permitted."
            }
          }
        },
        "subscriptionAlreadyOwned": "Your order could not be placed because you already have this subscription. You can see your subscriptions under My Subscriptions in your account.",
        "subscriptionLimitPerCart": "Your order could not be placed because a cart can contain only one subscription. Please remove the other subscription from your cart.",
        "subscriptionQuantityLimit": "Your order could not be placed because a subscription can only be ordered with a quantity of 1. Please correct the quantity in your cart.",
        "paymentethod": {
          "formentry": {
            "invalid": "Please check your payment details are correct or provide a different payment method."
          }
        },
        "giftcard": {
          "balance": {
            "insufficient": "Gift card has insufficient balance for this transaction.",
            "invalid": "Invalid gift card number or PIN. Please check your details.",
            "expired": "This gift card has expired.",
            "not": {
              "found": "Gift card not found. Please check the card number."
            }
          }
        },
        "partial": {
          "payment": {
            "failed": "Partial payment processing failed. Please try again.",
            "invalid": {
              "amount": "Invalid payment amount for partial payment.",
              "method": "Invalid payment method for partial payment."
            },
            "order": {
              "creation": {
                "failed": "Failed to create partial payment order. Please try again."
              }
            }
          }
        }
      }
    }
  }
}
