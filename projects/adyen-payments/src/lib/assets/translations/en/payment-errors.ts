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
        "paymentethod": {
          "formentry": {
            "invalid": "Please check your payment details are correct or provide a different payment method."
          }
        }
      }
    }
  }
}
