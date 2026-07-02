import { Component, inject, signal } from '@angular/core';
import { ProductCategory } from '../../common/product-category';
import { ProductService } from '../../services/product';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-product-category-menu',
  imports: [RouterLink],
  templateUrl: './product-category-menu.html',
  styleUrl: './product-category-menu.css',
})
export class ProductCategoryMenu {
  productCategories = signal<ProductCategory[]>([]);
  productService = inject(ProductService);

  constructor() {
    this.listProductCategories();
  }

  listProductCategories() {
    this.productService.getProductCategories().subscribe(
      data => {
        console.log('Product Categories=' + JSON.stringify(data));
        this.productCategories.set(data);
      }
    );
  }
}
