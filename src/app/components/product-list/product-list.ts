import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { ProductService } from '../../services/product';
import { Product } from '../../common/product';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.html',
  imports: [CurrencyPipe],
  styleUrl: './product-list.css',
})
export class ProductList {
  productService = inject(ProductService);
  products = signal<Product[]>([]);
  route: ActivatedRoute = inject(ActivatedRoute);
  currentCategoryId: number = 1;
  searchMode: boolean = false;

  constructor() {
    this.route.paramMap.subscribe(() => {
      this.listProducts();
    })
  }

  listProducts() {
    this.searchMode = this.route.snapshot.paramMap.has('keyword');

    if (this.searchMode) {
      this.handleSearchProducts();
    }
    else {
      this.handleListProducts();
    }
  }

  handleSearchProducts() {
    const keyword: string = this.route.snapshot.paramMap.get('keyword')!;
    this.productService.searchProducts(keyword).subscribe(
      data => {
        this.products.set(data);
      }
    )
  }

  handleListProducts() {
    const hasCategoryId: boolean = this.route.snapshot.paramMap.has('id');

    if (hasCategoryId) {
      this.currentCategoryId = Number(this.route.snapshot.paramMap.get('id'))!;
    }
    else {
      this.currentCategoryId = 1;
    }

    this.productService.getProductList(this.currentCategoryId).subscribe(data => {
      this.products.set(data);
    });
  }
}

