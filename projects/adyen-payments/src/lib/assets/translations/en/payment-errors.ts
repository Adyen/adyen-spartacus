export const paymentErrors = {
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
      "cvc": {
        "declined": "The payment is REFUSED. Please check your Card details."
      },
      "transaction": {
        "not": {
          "permitted": "The transaction is not permitted."
        }
      }
    }
  }
}
}