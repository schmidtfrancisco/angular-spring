import { Component, inject, signal } from '@angular/core';
import { Product } from '../../common/product';
import { ProductService } from '../../services/product';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-product-details',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  product = signal<Product|undefined>(undefined);
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);

  constructor() {
    this.route.paramMap.subscribe(() => {
      this.handleProductDetails();
    })
  }

  handleProductDetails() {
    const productId: number = Number(this.route.snapshot.paramMap.get('id'))!;
    this.productService.getProduct(productId).subscribe(
      data => {
        this.product.set(data);
      }
    )
  }
}
