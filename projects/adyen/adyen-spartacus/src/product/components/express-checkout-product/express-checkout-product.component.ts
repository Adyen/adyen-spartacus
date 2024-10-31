import { Component, OnInit } from '@angular/core';
import { CurrentProductService } from '@spartacus/storefront';
import { Observable } from 'rxjs';
import {
  BaseOption,
  isNotNullable,
  Product,
  RequiredPick,
  VariantType,
} from '@spartacus/core';

@Component({
  selector: 'cx-express-checkout-product',
  templateUrl: './express-checkout-product.component.html',
  styleUrl: './express-checkout-product.component.css'
})
export class ExpressCheckoutProductComponent implements OnInit {

  product: Product | null = null;

  constructor(protected currentProductService:CurrentProductService) {
  }

  ngOnInit() {
    this.currentProductService.getProduct().subscribe((product: Product | null) => {
      this.product = product;
    });
  }

}
