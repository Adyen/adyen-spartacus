import {Injectable} from "@angular/core";
import {Command, CommandService, CommandStrategy, EventService, UserIdService} from "@spartacus/core";
import {OrderConnector, OrderService} from '@spartacus/order/core';
import {Observable, switchMap, tap} from "rxjs";
import {OrderPlacedEvent} from '@spartacus/order/root';
import {PlaceOrderConnector} from "../core/connectors/placeorder.connector";
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {PlaceOrderRequest, PlaceOrderResponse} from "../core/models/occ.order.models";


@Injectable()
export class AdyenOrderService extends OrderService {

  constructor(protected placeOrderConnector: PlaceOrderConnector,
              protected override activeCartFacade: ActiveCartFacade,
              protected override userIdService: UserIdService,
              protected override commandService: CommandService,
              protected override orderConnector: OrderConnector,
              protected override eventService: EventService
  ) {
    super(activeCartFacade, userIdService, commandService, orderConnector, eventService)
  }


  protected adyenPlaceOrderCommand: Command<any, PlaceOrderResponse> =
    this.commandService.create<any, PlaceOrderResponse>(
      (paymentData) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId, cartId]) =>
            this.placeOrderConnector.placeOrder(userId, cartId, AdyenOrderService.preparePlaceOrderRequest(paymentData)).pipe(
              tap((placeOrderResponse) => {
                this.placedOrder$.next(placeOrderResponse.orderData);
                this.eventService.dispatch(
                  {
                    userId,
                    cartId,
                    /**
                     * As we know the cart is not anonymous (precondition checked),
                     * we can safely use the cartId, which is actually the cart.code.
                     */
                    cartCode: cartId,
                    order: placeOrderResponse.orderData!,
                  },
                  OrderPlacedEvent
                );
              })
            )
          )
        ),
      {
        strategy: CommandStrategy.CancelPrevious,
      }
    );

  adyenPlaceOrder(paymentData: any): Observable<PlaceOrderResponse> {
    return this.adyenPlaceOrderCommand.execute(paymentData);
  }


  static preparePlaceOrderRequest(paymentData: any): PlaceOrderRequest {
    return {
      paymentRequest: paymentData,
      useAdyenDeliveryAddress: true,
      billingAddress: undefined,
    }
  }

  // override placeOrder(paymentData: any): Observable<any> {
  //   return this.checkoutPreconditions().pipe(
  //     switchMap(([userId, cartId]) =>
  //       this.placeOrderConnector.placeOrder(userId, cartId, PlaceOrderAdyenService.preparePlaceOrderRequest(paymentData)).pipe(
  //         tap(placeOrderResponse => {
  //           this.placedOrder$.next(placeOrderResponse.orderData);
  //
  //           this.eventService.dispatch(
  //             {
  //               userId,
  //               cartId,
  //               /**
  //                * As we know the cart is not anonymous (precondition checked),
  //                * we can safely use the cartId, which is actually the cart.code.
  //                */
  //               cartCode: cartId,
  //               order: placeOrderResponse.orderData!,
  //             },
  //             OrderPlacedEvent
  //           );
  //         })
  //       )
  //     )
  //   );
  // }

  // override getOrderDetails(): Observable<Order | undefined>{
  //   //return super.getOrderDetails();
  //
  //   // @ts-ignore
  //   return of({
  //     "code": "00020000",
  //     "name": null,
  //     "description": null,
  //     "expirationTime": null,
  //     "net": false,
  //     "totalPriceWithTax": {
  //       "currencyIso": "USD",
  //       "value": 123.11,
  //       "priceType": "BUY",
  //       "formattedValue": "$123.11",
  //       "minQuantity": null,
  //       "maxQuantity": null
  //     },
  //     "totalPrice": {
  //       "currencyIso": "USD",
  //       "value": 123.11,
  //       "priceType": "BUY",
  //       "formattedValue": "$123.11",
  //       "minQuantity": null,
  //       "maxQuantity": null
  //     },
  //     "totalTax": {
  //       "currencyIso": "USD",
  //       "value": 5.86,
  //       "priceType": "BUY",
  //       "formattedValue": "$5.86",
  //       "minQuantity": null,
  //       "maxQuantity": null
  //     },
  //     "subTotal": {
  //       "currencyIso": "USD",
  //       "value": 114.12,
  //       "priceType": "BUY",
  //       "formattedValue": "$114.12",
  //       "minQuantity": null,
  //       "maxQuantity": null
  //     },
  //     "subTotalWithoutQuoteDiscounts": {
  //       "currencyIso": "USD",
  //       "value": 114.12,
  //       "priceType": "BUY",
  //       "formattedValue": "$114.12",
  //       "minQuantity": null,
  //       "maxQuantity": null
  //     },
  //     "deliveryCost": {
  //       "currencyIso": "USD",
  //       "value": 8.99,
  //       "priceType": "BUY",
  //       "formattedValue": "$8.99",
  //       "minQuantity": null,
  //       "maxQuantity": null
  //     },
  //     "entries": [
  //       {
  //         "entryNumber": 0,
  //         "quantity": 1,
  //         "basePrice": {
  //           "currencyIso": "USD",
  //           "value": 114.12,
  //           "priceType": "BUY",
  //           "formattedValue": "$114.12",
  //           "minQuantity": null,
  //           "maxQuantity": null
  //         },
  //         "totalPrice": {
  //           "currencyIso": "USD",
  //           "value": 114.12,
  //           "priceType": "BUY",
  //           "formattedValue": "$114.12",
  //           "minQuantity": null,
  //           "maxQuantity": null
  //         },
  //         "product": {
  //           "code": "300938",
  //           "name": "Photosmart E317 Digital Camera",
  //           "url": "/Open-Catalogue/Cameras/Digital-Cameras/Digital-Compacts/Photosmart-E317-Digital-Camera/p/300938",
  //           "description": null,
  //           "purchasable": true,
  //           "stock": {
  //             "stockLevelStatus": {
  //               "code": "inStock",
  //               "type": "StockLevelStatus"
  //             },
  //             "stockLevel": 314,
  //             "stockThreshold": null
  //           },
  //           "futureStocks": null,
  //           "availableForPickup": true,
  //           "averageRating": 4.5,
  //           "numberOfReviews": null,
  //           "summary": null,
  //           "manufacturer": "HP",
  //           "variantType": null,
  //           "price": null,
  //           "baseProduct": null,
  //           "images": [
  //             {
  //               "imageType": "PRIMARY",
  //               "format": "zoom",
  //               "url": "/medias/?context=bWFzdGVyfGltYWdlc3wxMzkzNnxpbWFnZS9qcGVnfGFXMWhaMlZ6TDJneFl5OW9NVEF2T0RjNU56RTVPVFUyTkRnek1DNXFjR2N8OTNjNmVmM2Y2MmFkZmRmZWQ2YzUwMmFhYzYyY2M3MzY2YTgxODY3YWQ2MWIxNWI3Mjc0MjFiZjllMTI3ZWNmNg",
  //               "altText": "Photosmart E317 Digital Camera",
  //               "galleryIndex": null,
  //               "width": null
  //             },
  //             {
  //               "imageType": "PRIMARY",
  //               "format": "product",
  //               "url": "/medias/?context=bWFzdGVyfGltYWdlc3w3MDg1fGltYWdlL2pwZWd8YVcxaFoyVnpMMmhtWVM5b01qZ3ZPRGM1TnpJeE1qY3dORGM1T0M1cWNHY3wyZGI3ZGRiZDYyNmMwZDRhZWUwNjg5YTk4MjlmN2UzZDcyNzcxNzBiYzIzYzEzNGFlM2M1OTg4YmU5MzNmYmU2",
  //               "altText": "Photosmart E317 Digital Camera",
  //               "galleryIndex": null,
  //               "width": null
  //             },
  //             {
  //               "imageType": "PRIMARY",
  //               "format": "thumbnail",
  //               "url": "/medias/?context=bWFzdGVyfGltYWdlc3wyMDYxfGltYWdlL2pwZWd8YVcxaFoyVnpMMmhrT1M5b1pXVXZPRGM1TnpJeU5UZzNOelV6TkM1cWNHY3w0YTk5YTcyZDIwOTRhODA1NjIwZDlhZGJmN2QyZTRmM2QxYTYwZjBkNWZlYWI3MDczMWRiYTMyZjYwODZmZDYy",
  //               "altText": "Photosmart E317 Digital Camera",
  //               "galleryIndex": null,
  //               "width": null
  //             },
  //             {
  //               "imageType": "PRIMARY",
  //               "format": "cartIcon",
  //               "url": "/medias/?context=bWFzdGVyfGltYWdlc3wxNDQwfGltYWdlL2pwZWd8YVcxaFoyVnpMMmhqTmk5b1kyVXZPRGM1TnpJek9UQTFNREkzTUM1cWNHY3w4NDhkYmZhZjQ2Njg4MGZlODI3ZjI1NjZjOWJlODk2M2M2MGY5ZTU0MmM5MjJkZWEzNWNhNTdhNTc3MDI1MTE0",
  //               "altText": "Photosmart E317 Digital Camera",
  //               "galleryIndex": null,
  //               "width": null
  //             }
  //           ],
  //           "categories": [
  //             {
  //               "code": "576",
  //               "name": "Digital Compacts",
  //               "url": "/Open-Catalogue/Cameras/Digital-Cameras/Digital-Compacts/c/576",
  //               "description": null,
  //               "image": null,
  //               "parentCategoryName": null,
  //               "sequence": 0
  //             },
  //             {
  //               "code": "brand_1",
  //               "name": "HP",
  //               "url": "/Brands/HP/c/brand_1",
  //               "description": null,
  //               "image": null,
  //               "parentCategoryName": null,
  //               "sequence": 0
  //             }
  //           ],
  //           "reviews": null,
  //           "classifications": null,
  //           "potentialPromotions": null,
  //           "variantOptions": null,
  //           "baseOptions": [],
  //           "volumePricesFlag": null,
  //           "volumePrices": null,
  //           "productReferences": null,
  //           "variantMatrix": null,
  //           "priceRange": null,
  //           "firstCategoryNameList": null,
  //           "multidimensional": null,
  //           "configurable": false,
  //           "configuratorType": null,
  //           "addToCartDisabled": null,
  //           "addToCartDisabledMessage": null,
  //           "tags": null,
  //           "orderFormQuantity": null,
  //           "soldIndividually": false,
  //           "lowestBundlePrice": null,
  //           "bundleTemplates": null,
  //           "entitlements": [],
  //           "itemType": "Product",
  //           "subscriptionTerm": null,
  //           "keywords": null,
  //           "firstVariantCode": null,
  //           "firstVariantImage": null,
  //           "timedAccessPromotion": null,
  //           "genders": null
  //         },
  //         "updateable": true,
  //         "deliveryMode": null,
  //         "deliveryPointOfService": null,
  //         "entries": null,
  //         "configurationInfos": [],
  //         "statusSummaryMap": {},
  //         "entryGroupNumbers": [],
  //         "comments": [],
  //         "url": null,
  //         "cancellableQty": 1,
  //         "returnableQty": 0,
  //         "cancelledItemsPrice": null,
  //         "returnedItemsPrice": null,
  //         "removeable": false,
  //         "editable": false,
  //         "valid": false,
  //         "addable": false,
  //         "orderEntryPrices": [
  //           {
  //             "totalPrice": {
  //               "currencyIso": "USD",
  //               "value": 114.12,
  //               "priceType": "BUY",
  //               "formattedValue": "$114.12",
  //               "minQuantity": null,
  //               "maxQuantity": null
  //             },
  //             "billingTime": {
  //               "code": "paynow",
  //               "name": "Pay on Checkout",
  //               "nameInOrder": "Paid on order",
  //               "description": "Pay Now",
  //               "orderNumber": 1
  //             },
  //             "basePrice": {
  //               "currencyIso": "USD",
  //               "value": 114.12,
  //               "priceType": "BUY",
  //               "formattedValue": "$114.12",
  //               "minQuantity": null,
  //               "maxQuantity": null
  //             },
  //             "defaultPrice": false
  //           }
  //         ],
  //         "originalSubscriptionId": null,
  //         "originalOrderCode": null,
  //         "originalEntryNumber": 0,
  //         "entryMessage": null,
  //         "supportedActions": null,
  //         "taxValues": [
  //           {
  //             "code": "jp-vat-full",
  //             "value": 5,
  //             "appliedValue": 5.43,
  //             "absolute": false,
  //             "currencyIsoCode": "USD"
  //           }
  //         ],
  //         "quantityAllocated": null,
  //         "quantityUnallocated": null,
  //         "quantityCancelled": null,
  //         "quantityPending": null,
  //         "quantityShipped": null,
  //         "quantityReturned": null,
  //         "configurationAttached": false,
  //         "itemPK": null,
  //         "configurationConsistent": false,
  //         "configurationErrorCount": 0,
  //         "addToCartTime": 1721030431431,
  //         "cartSourceType": "STOREFRONT"
  //       }
  //     ],
  //     "totalItems": 1,
  //     "deliveryMode": {
  //       "code": "standard-gross",
  //       "name": "Standard Delivery",
  //       "description": "3-5 business days",
  //       "deliveryCost": {
  //         "currencyIso": "USD",
  //         "value": 8.99,
  //         "priceType": "BUY",
  //         "formattedValue": "$8.99",
  //         "minQuantity": null,
  //         "maxQuantity": null
  //       }
  //     },
  //     "deliveryAddress": {
  //       "id": "8796945055767",
  //       "title": null,
  //       "titleCode": null,
  //       "firstName": "firstname",
  //       "lastName": "dsadas",
  //       "companyName": null,
  //       "line1": "addressline1",
  //       "line2": "",
  //       "town": "city",
  //       "region": null,
  //       "district": null,
  //       "postalCode": "postcode",
  //       "phone": "",
  //       "cellphone": null,
  //       "email": null,
  //       "country": {
  //         "isocode": "AT",
  //         "name": "Austria"
  //       },
  //       "shippingAddress": true,
  //       "billingAddress": false,
  //       "defaultAddress": false,
  //       "visibleInAddressBook": true,
  //       "formattedAddress": "addressline1, , city, postcode",
  //       "editable": true,
  //       "fullname": null,
  //       "city": null,
  //       "cityDistrict": null,
  //       "fullnameWithTitle": " firstname dsadas"
  //     },
  //     "paymentInfo": {
  //       "id": null,
  //       "accountHolderName": null,
  //       "cardType": null,
  //       "cardTypeData": null,
  //       "cardNumber": null,
  //       "startMonth": null,
  //       "startYear": null,
  //       "expiryMonth": null,
  //       "expiryYear": null,
  //       "issueNumber": null,
  //       "subscriptionId": null,
  //       "saved": false,
  //       "defaultPaymentInfo": false,
  //       "billingAddress": {
  //         "id": "8796945121303",
  //         "title": null,
  //         "titleCode": null,
  //         "firstName": "firstname",
  //         "lastName": "dsadas",
  //         "companyName": null,
  //         "line1": "addressline1",
  //         "line2": "",
  //         "town": "city",
  //         "region": null,
  //         "district": null,
  //         "postalCode": "postcode",
  //         "phone": "",
  //         "cellphone": null,
  //         "email": null,
  //         "country": {
  //           "isocode": "AT",
  //           "name": "Austria"
  //         },
  //         "shippingAddress": true,
  //         "billingAddress": true,
  //         "defaultAddress": false,
  //         "visibleInAddressBook": true,
  //         "formattedAddress": "addressline1, , city, postcode",
  //         "editable": true,
  //         "fullname": null,
  //         "city": null,
  //         "cityDistrict": null,
  //         "fullnameWithTitle": " firstname dsadas"
  //       },
  //       "subscriptionServiceId": null
  //     },
  //     "appliedOrderPromotions": [],
  //     "appliedProductPromotions": [],
  //     "productDiscounts": {
  //       "currencyIso": "USD",
  //       "value": 0,
  //       "priceType": "BUY",
  //       "formattedValue": "$0.00",
  //       "minQuantity": null,
  //       "maxQuantity": null
  //     },
  //     "orderDiscounts": {
  //       "currencyIso": "USD",
  //       "value": 0,
  //       "priceType": "BUY",
  //       "formattedValue": "$0.00",
  //       "minQuantity": null,
  //       "maxQuantity": null
  //     },
  //     "quoteDiscounts": {
  //       "currencyIso": "USD",
  //       "value": 0,
  //       "priceType": "BUY",
  //       "formattedValue": "$0.00",
  //       "minQuantity": null,
  //       "maxQuantity": null
  //     },
  //     "quoteDiscountsRate": 0,
  //     "quoteDiscountsType": "PERCENT",
  //     "totalDiscounts": {
  //       "currencyIso": "USD",
  //       "value": 0,
  //       "priceType": "BUY",
  //       "formattedValue": "$0.00",
  //       "minQuantity": null,
  //       "maxQuantity": null
  //     },
  //     "totalDiscountsWithQuoteDiscounts": {
  //       "currencyIso": "USD",
  //       "value": 0,
  //       "priceType": "BUY",
  //       "formattedValue": "$0.00",
  //       "minQuantity": null,
  //       "maxQuantity": null
  //     },
  //     "subTotalWithDiscounts": null,
  //     "site": "electronics-spa",
  //     "store": "electronics",
  //     "guid": "93426f07-1704-49f6-9cd3-5eb26219228a",
  //     "calculated": true,
  //     "appliedVouchers": [],
  //     "user": {
  //       "uid": "test@address.com",
  //       "name": "test name"
  //     },
  //     "pickupOrderGroups": [],
  //     "deliveryOrderGroups": [
  //       {
  //         "totalPriceWithTax": {
  //           "currencyIso": "USD",
  //           "value": 119.55000000000001,
  //           "priceType": "BUY",
  //           "formattedValue": "$119.55",
  //           "minQuantity": null,
  //           "maxQuantity": null
  //         },
  //         "entries": [
  //           {
  //             "entryNumber": 0,
  //             "quantity": 1,
  //             "basePrice": {
  //               "currencyIso": "USD",
  //               "value": 114.12,
  //               "priceType": "BUY",
  //               "formattedValue": "$114.12",
  //               "minQuantity": null,
  //               "maxQuantity": null
  //             },
  //             "totalPrice": {
  //               "currencyIso": "USD",
  //               "value": 114.12,
  //               "priceType": "BUY",
  //               "formattedValue": "$114.12",
  //               "minQuantity": null,
  //               "maxQuantity": null
  //             },
  //             "product": {
  //               "code": "300938",
  //               "name": "Photosmart E317 Digital Camera",
  //               "url": "/Open-Catalogue/Cameras/Digital-Cameras/Digital-Compacts/Photosmart-E317-Digital-Camera/p/300938",
  //               "description": null,
  //               "purchasable": true,
  //               "stock": {
  //                 "stockLevelStatus": {
  //                   "code": "inStock",
  //                   "type": "StockLevelStatus"
  //                 },
  //                 "stockLevel": 314,
  //                 "stockThreshold": null
  //               },
  //               "futureStocks": null,
  //               "availableForPickup": true,
  //               "averageRating": 4.5,
  //               "numberOfReviews": null,
  //               "summary": null,
  //               "manufacturer": "HP",
  //               "variantType": null,
  //               "price": null,
  //               "baseProduct": null,
  //               "images": [
  //                 {
  //                   "imageType": "PRIMARY",
  //                   "format": "zoom",
  //                   "url": "/medias/?context=bWFzdGVyfGltYWdlc3wxMzkzNnxpbWFnZS9qcGVnfGFXMWhaMlZ6TDJneFl5OW9NVEF2T0RjNU56RTVPVFUyTkRnek1DNXFjR2N8OTNjNmVmM2Y2MmFkZmRmZWQ2YzUwMmFhYzYyY2M3MzY2YTgxODY3YWQ2MWIxNWI3Mjc0MjFiZjllMTI3ZWNmNg",
  //                   "altText": "Photosmart E317 Digital Camera",
  //                   "galleryIndex": null,
  //                   "width": null
  //                 },
  //                 {
  //                   "imageType": "PRIMARY",
  //                   "format": "product",
  //                   "url": "/medias/?context=bWFzdGVyfGltYWdlc3w3MDg1fGltYWdlL2pwZWd8YVcxaFoyVnpMMmhtWVM5b01qZ3ZPRGM1TnpJeE1qY3dORGM1T0M1cWNHY3wyZGI3ZGRiZDYyNmMwZDRhZWUwNjg5YTk4MjlmN2UzZDcyNzcxNzBiYzIzYzEzNGFlM2M1OTg4YmU5MzNmYmU2",
  //                   "altText": "Photosmart E317 Digital Camera",
  //                   "galleryIndex": null,
  //                   "width": null
  //                 },
  //                 {
  //                   "imageType": "PRIMARY",
  //                   "format": "thumbnail",
  //                   "url": "/medias/?context=bWFzdGVyfGltYWdlc3wyMDYxfGltYWdlL2pwZWd8YVcxaFoyVnpMMmhrT1M5b1pXVXZPRGM1TnpJeU5UZzNOelV6TkM1cWNHY3w0YTk5YTcyZDIwOTRhODA1NjIwZDlhZGJmN2QyZTRmM2QxYTYwZjBkNWZlYWI3MDczMWRiYTMyZjYwODZmZDYy",
  //                   "altText": "Photosmart E317 Digital Camera",
  //                   "galleryIndex": null,
  //                   "width": null
  //                 },
  //                 {
  //                   "imageType": "PRIMARY",
  //                   "format": "cartIcon",
  //                   "url": "/medias/?context=bWFzdGVyfGltYWdlc3wxNDQwfGltYWdlL2pwZWd8YVcxaFoyVnpMMmhqTmk5b1kyVXZPRGM1TnpJek9UQTFNREkzTUM1cWNHY3w4NDhkYmZhZjQ2Njg4MGZlODI3ZjI1NjZjOWJlODk2M2M2MGY5ZTU0MmM5MjJkZWEzNWNhNTdhNTc3MDI1MTE0",
  //                   "altText": "Photosmart E317 Digital Camera",
  //                   "galleryIndex": null,
  //                   "width": null
  //                 }
  //               ],
  //               "categories": [
  //                 {
  //                   "code": "576",
  //                   "name": "Digital Compacts",
  //                   "url": "/Open-Catalogue/Cameras/Digital-Cameras/Digital-Compacts/c/576",
  //                   "description": null,
  //                   "image": null,
  //                   "parentCategoryName": null,
  //                   "sequence": 0
  //                 },
  //                 {
  //                   "code": "brand_1",
  //                   "name": "HP",
  //                   "url": "/Brands/HP/c/brand_1",
  //                   "description": null,
  //                   "image": null,
  //                   "parentCategoryName": null,
  //                   "sequence": 0
  //                 }
  //               ],
  //               "reviews": null,
  //               "classifications": null,
  //               "potentialPromotions": null,
  //               "variantOptions": null,
  //               "baseOptions": [],
  //               "volumePricesFlag": null,
  //               "volumePrices": null,
  //               "productReferences": null,
  //               "variantMatrix": null,
  //               "priceRange": null,
  //               "firstCategoryNameList": null,
  //               "multidimensional": null,
  //               "configurable": false,
  //               "configuratorType": null,
  //               "addToCartDisabled": null,
  //               "addToCartDisabledMessage": null,
  //               "tags": null,
  //               "orderFormQuantity": null,
  //               "soldIndividually": false,
  //               "lowestBundlePrice": null,
  //               "bundleTemplates": null,
  //               "entitlements": [],
  //               "itemType": "Product",
  //               "subscriptionTerm": null,
  //               "keywords": null,
  //               "firstVariantCode": null,
  //               "firstVariantImage": null,
  //               "timedAccessPromotion": null,
  //               "genders": null
  //             },
  //             "updateable": true,
  //             "deliveryMode": null,
  //             "deliveryPointOfService": null,
  //             "entries": null,
  //             "configurationInfos": [],
  //             "statusSummaryMap": {},
  //             "entryGroupNumbers": [],
  //             "comments": [],
  //             "url": null,
  //             "cancellableQty": 1,
  //             "returnableQty": 0,
  //             "cancelledItemsPrice": null,
  //             "returnedItemsPrice": null,
  //             "removeable": false,
  //             "editable": false,
  //             "valid": false,
  //             "addable": false,
  //             "orderEntryPrices": [
  //               {
  //                 "totalPrice": {
  //                   "currencyIso": "USD",
  //                   "value": 114.12,
  //                   "priceType": "BUY",
  //                   "formattedValue": "$114.12",
  //                   "minQuantity": null,
  //                   "maxQuantity": null
  //                 },
  //                 "billingTime": {
  //                   "code": "paynow",
  //                   "name": "Pay on Checkout",
  //                   "nameInOrder": "Paid on order",
  //                   "description": "Pay Now",
  //                   "orderNumber": 1
  //                 },
  //                 "basePrice": {
  //                   "currencyIso": "USD",
  //                   "value": 114.12,
  //                   "priceType": "BUY",
  //                   "formattedValue": "$114.12",
  //                   "minQuantity": null,
  //                   "maxQuantity": null
  //                 },
  //                 "defaultPrice": false
  //               }
  //             ],
  //             "originalSubscriptionId": null,
  //             "originalOrderCode": null,
  //             "originalEntryNumber": 0,
  //             "entryMessage": null,
  //             "supportedActions": null,
  //             "taxValues": [
  //               {
  //                 "code": "jp-vat-full",
  //                 "value": 5,
  //                 "appliedValue": 5.43,
  //                 "absolute": false,
  //                 "currencyIsoCode": "USD"
  //               }
  //             ],
  //             "quantityAllocated": null,
  //             "quantityUnallocated": null,
  //             "quantityCancelled": null,
  //             "quantityPending": null,
  //             "quantityShipped": null,
  //             "quantityReturned": null,
  //             "configurationAttached": false,
  //             "itemPK": null,
  //             "configurationConsistent": false,
  //             "configurationErrorCount": 0,
  //             "addToCartTime": 1721030431431,
  //             "cartSourceType": "STOREFRONT"
  //           }
  //         ],
  //         "quantity": null,
  //         "deliveryAddress": null
  //       }
  //     ],
  //     "pickupItemsQuantity": 0,
  //     "deliveryItemsQuantity": 1,
  //     "totalUnitCount": 1,
  //     "comments": null,
  //     "rootGroups": null,
  //     "orderPrices": [
  //       {
  //         "totalPrice": {
  //           "currencyIso": "USD",
  //           "value": 123.11,
  //           "priceType": "BUY",
  //           "formattedValue": "$123.11",
  //           "minQuantity": null,
  //           "maxQuantity": null
  //         },
  //         "billingTime": {
  //           "code": "paynow",
  //           "name": "Pay on Checkout",
  //           "nameInOrder": "Paid on order",
  //           "description": "Pay Now",
  //           "orderNumber": 1
  //         },
  //         "totalTax": {
  //           "currencyIso": "USD",
  //           "value": 5.86,
  //           "priceType": "BUY",
  //           "formattedValue": "$5.86",
  //           "minQuantity": null,
  //           "maxQuantity": null
  //         },
  //         "subTotal": {
  //           "currencyIso": "USD",
  //           "value": 114.12,
  //           "priceType": "BUY",
  //           "formattedValue": "$114.12",
  //           "minQuantity": null,
  //           "maxQuantity": null
  //         },
  //         "deliveryCost": {
  //           "currencyIso": "USD",
  //           "value": 8.99,
  //           "priceType": "BUY",
  //           "formattedValue": "$8.99",
  //           "minQuantity": null,
  //           "maxQuantity": null
  //         },
  //         "totalDiscounts": {
  //           "currencyIso": "USD",
  //           "value": 0,
  //           "priceType": "BUY",
  //           "formattedValue": "$0.00",
  //           "minQuantity": null,
  //           "maxQuantity": null
  //         },
  //         "appliedProductPromotions": [],
  //         "appliedOrderPromotions": [],
  //         "potentialProductPromotions": [],
  //         "potentialOrderPromotions": []
  //       }
  //     ],
  //     "merchantCustomerId": "121f5464-064b-42a3-90e7-881f41270619",
  //     "adyenBoletoUrl": null,
  //     "adyenBoletoData": null,
  //     "adyenBoletoBarCodeReference": null,
  //     "adyenBoletoExpirationDate": null,
  //     "adyenBoletoDueDate": null,
  //     "adyenMultibancoEntity": null,
  //     "adyenMultibancoAmount": null,
  //     "adyenMultibancoDeadline": null,
  //     "adyenMultibancoReference": null,
  //     "adyenPosReceipt": null,
  //     "created": 1721030455172,
  //     "status": null,
  //     "statusDisplay": "processing",
  //     "guestCustomer": false,
  //     "consignments": [],
  //     "deliveryStatus": null,
  //     "deliveryStatusDisplay": null,
  //     "unconsignedEntries": [
  //       {
  //         "entryNumber": 0,
  //         "quantity": 1,
  //         "basePrice": {
  //           "currencyIso": "USD",
  //           "value": 114.12,
  //           "priceType": "BUY",
  //           "formattedValue": "$114.12",
  //           "minQuantity": null,
  //           "maxQuantity": null
  //         },
  //         "totalPrice": {
  //           "currencyIso": "USD",
  //           "value": 114.12,
  //           "priceType": "BUY",
  //           "formattedValue": "$114.12",
  //           "minQuantity": null,
  //           "maxQuantity": null
  //         },
  //         "product": {
  //           "code": "300938",
  //           "name": "Photosmart E317 Digital Camera",
  //           "url": "/Open-Catalogue/Cameras/Digital-Cameras/Digital-Compacts/Photosmart-E317-Digital-Camera/p/300938",
  //           "description": null,
  //           "purchasable": true,
  //           "stock": {
  //             "stockLevelStatus": {
  //               "code": "inStock",
  //               "type": "StockLevelStatus"
  //             },
  //             "stockLevel": 314,
  //             "stockThreshold": null
  //           },
  //           "futureStocks": null,
  //           "availableForPickup": true,
  //           "averageRating": 4.5,
  //           "numberOfReviews": null,
  //           "summary": null,
  //           "manufacturer": "HP",
  //           "variantType": null,
  //           "price": null,
  //           "baseProduct": null,
  //           "images": [
  //             {
  //               "imageType": "PRIMARY",
  //               "format": "zoom",
  //               "url": "/medias/?context=bWFzdGVyfGltYWdlc3wxMzkzNnxpbWFnZS9qcGVnfGFXMWhaMlZ6TDJneFl5OW9NVEF2T0RjNU56RTVPVFUyTkRnek1DNXFjR2N8OTNjNmVmM2Y2MmFkZmRmZWQ2YzUwMmFhYzYyY2M3MzY2YTgxODY3YWQ2MWIxNWI3Mjc0MjFiZjllMTI3ZWNmNg",
  //               "altText": "Photosmart E317 Digital Camera",
  //               "galleryIndex": null,
  //               "width": null
  //             },
  //             {
  //               "imageType": "PRIMARY",
  //               "format": "product",
  //               "url": "/medias/?context=bWFzdGVyfGltYWdlc3w3MDg1fGltYWdlL2pwZWd8YVcxaFoyVnpMMmhtWVM5b01qZ3ZPRGM1TnpJeE1qY3dORGM1T0M1cWNHY3wyZGI3ZGRiZDYyNmMwZDRhZWUwNjg5YTk4MjlmN2UzZDcyNzcxNzBiYzIzYzEzNGFlM2M1OTg4YmU5MzNmYmU2",
  //               "altText": "Photosmart E317 Digital Camera",
  //               "galleryIndex": null,
  //               "width": null
  //             },
  //             {
  //               "imageType": "PRIMARY",
  //               "format": "thumbnail",
  //               "url": "/medias/?context=bWFzdGVyfGltYWdlc3wyMDYxfGltYWdlL2pwZWd8YVcxaFoyVnpMMmhrT1M5b1pXVXZPRGM1TnpJeU5UZzNOelV6TkM1cWNHY3w0YTk5YTcyZDIwOTRhODA1NjIwZDlhZGJmN2QyZTRmM2QxYTYwZjBkNWZlYWI3MDczMWRiYTMyZjYwODZmZDYy",
  //               "altText": "Photosmart E317 Digital Camera",
  //               "galleryIndex": null,
  //               "width": null
  //             },
  //             {
  //               "imageType": "PRIMARY",
  //               "format": "cartIcon",
  //               "url": "/medias/?context=bWFzdGVyfGltYWdlc3wxNDQwfGltYWdlL2pwZWd8YVcxaFoyVnpMMmhqTmk5b1kyVXZPRGM1TnpJek9UQTFNREkzTUM1cWNHY3w4NDhkYmZhZjQ2Njg4MGZlODI3ZjI1NjZjOWJlODk2M2M2MGY5ZTU0MmM5MjJkZWEzNWNhNTdhNTc3MDI1MTE0",
  //               "altText": "Photosmart E317 Digital Camera",
  //               "galleryIndex": null,
  //               "width": null
  //             }
  //           ],
  //           "categories": [
  //             {
  //               "code": "576",
  //               "name": "Digital Compacts",
  //               "url": "/Open-Catalogue/Cameras/Digital-Cameras/Digital-Compacts/c/576",
  //               "description": null,
  //               "image": null,
  //               "parentCategoryName": null,
  //               "sequence": 0
  //             },
  //             {
  //               "code": "brand_1",
  //               "name": "HP",
  //               "url": "/Brands/HP/c/brand_1",
  //               "description": null,
  //               "image": null,
  //               "parentCategoryName": null,
  //               "sequence": 0
  //             }
  //           ],
  //           "reviews": null,
  //           "classifications": null,
  //           "potentialPromotions": null,
  //           "variantOptions": null,
  //           "baseOptions": [],
  //           "volumePricesFlag": null,
  //           "volumePrices": null,
  //           "productReferences": null,
  //           "variantMatrix": null,
  //           "priceRange": null,
  //           "firstCategoryNameList": null,
  //           "multidimensional": null,
  //           "configurable": false,
  //           "configuratorType": null,
  //           "addToCartDisabled": null,
  //           "addToCartDisabledMessage": null,
  //           "tags": null,
  //           "orderFormQuantity": null,
  //           "soldIndividually": false,
  //           "lowestBundlePrice": null,
  //           "bundleTemplates": null,
  //           "entitlements": [],
  //           "itemType": "Product",
  //           "subscriptionTerm": null,
  //           "keywords": null,
  //           "firstVariantCode": null,
  //           "firstVariantImage": null,
  //           "timedAccessPromotion": null,
  //           "genders": null
  //         },
  //         "updateable": true,
  //         "deliveryMode": null,
  //         "deliveryPointOfService": null,
  //         "entries": null,
  //         "configurationInfos": [],
  //         "statusSummaryMap": {},
  //         "entryGroupNumbers": [],
  //         "comments": [],
  //         "url": null,
  //         "cancellableQty": 0,
  //         "returnableQty": 0,
  //         "cancelledItemsPrice": null,
  //         "returnedItemsPrice": null,
  //         "removeable": false,
  //         "editable": false,
  //         "valid": false,
  //         "addable": false,
  //         "orderEntryPrices": [
  //           {
  //             "totalPrice": {
  //               "currencyIso": "USD",
  //               "value": 114.12,
  //               "priceType": "BUY",
  //               "formattedValue": "$114.12",
  //               "minQuantity": null,
  //               "maxQuantity": null
  //             },
  //             "billingTime": {
  //               "code": "paynow",
  //               "name": "Pay on Checkout",
  //               "nameInOrder": "Paid on order",
  //               "description": "Pay Now",
  //               "orderNumber": 1
  //             },
  //             "basePrice": {
  //               "currencyIso": "USD",
  //               "value": 114.12,
  //               "priceType": "BUY",
  //               "formattedValue": "$114.12",
  //               "minQuantity": null,
  //               "maxQuantity": null
  //             },
  //             "defaultPrice": false
  //           }
  //         ],
  //         "originalSubscriptionId": null,
  //         "originalOrderCode": null,
  //         "originalEntryNumber": 0,
  //         "entryMessage": null,
  //         "supportedActions": null,
  //         "taxValues": [
  //           {
  //             "code": "jp-vat-full",
  //             "value": 5,
  //             "appliedValue": 5.43,
  //             "absolute": false,
  //             "currencyIsoCode": "USD"
  //           }
  //         ],
  //         "quantityAllocated": null,
  //         "quantityUnallocated": null,
  //         "quantityCancelled": null,
  //         "quantityPending": null,
  //         "quantityShipped": null,
  //         "quantityReturned": null,
  //         "configurationAttached": false,
  //         "itemPK": null,
  //         "configurationConsistent": false,
  //         "configurationErrorCount": 0,
  //         "addToCartTime": 1721030431431,
  //         "cartSourceType": "STOREFRONT"
  //       }
  //     ],
  //     "placedBy": null,
  //     "quoteCode": null,
  //     "cancellable": true,
  //     "returnable": false,
  //     "costCenter": null,
  //     "paymentType": {
  //       "code": "CARD",
  //       "displayName": "Card Payment"
  //     },
  //     "b2BComment": null,
  //     "b2bCustomerData": {
  //       "uid": "test@address.com",
  //       "name": "test name",
  //       "defaultBillingAddress": {
  //         "id": "8796256894999",
  //         "title": null,
  //         "titleCode": null,
  //         "firstName": "firstname",
  //         "lastName": "dsadas",
  //         "companyName": null,
  //         "line1": "addressline1",
  //         "line2": "",
  //         "town": "city",
  //         "region": null,
  //         "district": null,
  //         "postalCode": "postcode",
  //         "phone": "",
  //         "cellphone": null,
  //         "email": null,
  //         "country": {
  //           "isocode": "AT",
  //           "name": "Austria"
  //         },
  //         "shippingAddress": true,
  //         "billingAddress": false,
  //         "defaultAddress": false,
  //         "visibleInAddressBook": true,
  //         "formattedAddress": "addressline1, , city, postcode",
  //         "editable": true,
  //         "fullname": null,
  //         "city": null,
  //         "cityDistrict": null,
  //         "fullnameWithTitle": " firstname dsadas"
  //       },
  //       "defaultShippingAddress": {
  //         "id": "8796256894999",
  //         "title": null,
  //         "titleCode": null,
  //         "firstName": "firstname",
  //         "lastName": "dsadas",
  //         "companyName": null,
  //         "line1": "addressline1",
  //         "line2": "",
  //         "town": "city",
  //         "region": null,
  //         "district": null,
  //         "postalCode": "postcode",
  //         "phone": "",
  //         "cellphone": null,
  //         "email": null,
  //         "country": {
  //           "isocode": "AT",
  //           "name": "Austria"
  //         },
  //         "shippingAddress": true,
  //         "billingAddress": false,
  //         "defaultAddress": false,
  //         "visibleInAddressBook": true,
  //         "formattedAddress": "addressline1, , city, postcode",
  //         "editable": true,
  //         "fullname": null,
  //         "city": null,
  //         "cityDistrict": null,
  //         "fullnameWithTitle": " firstname dsadas"
  //       },
  //       "titleCode": null,
  //       "title": null,
  //       "firstName": "test",
  //       "lastName": "name",
  //       "currency": {
  //         "isocode": "USD",
  //         "name": "US Dollar",
  //         "active": false,
  //         "symbol": "$"
  //       },
  //       "language": {
  //         "isocode": "en",
  //         "name": "English",
  //         "nativeName": "English",
  //         "active": true,
  //         "required": false
  //       },
  //       "displayUid": "test@address.com",
  //       "customerId": "121f5464-064b-42a3-90e7-881f41270619",
  //       "deactivationDate": null,
  //       "sitePreference": {
  //         "pickUpLocationName": null
  //       },
  //       "normalizedUid": null,
  //       "unit": null,
  //       "email": null,
  //       "contactNumber": null,
  //       "active": false,
  //       "selected": false,
  //       "roles": null,
  //       "displayRoles": null,
  //       "permissionGroups": null,
  //       "approvers": null,
  //       "approverGroups": null,
  //       "permissions": null,
  //       "defaultAddress": null,
  //       "latestCartId": null,
  //       "hasOrder": null,
  //       "profilePicture": null
  //     },
  //     "orgUnit": null,
  //     "b2bCommentData": [],
  //     "quoteExpirationDate": null,
  //     "purchaseOrderNumber": null,
  //     "triggerData": null,
  //     "b2bPermissionResult": [],
  //     "jobCode": null
  //   })
  // }

}
