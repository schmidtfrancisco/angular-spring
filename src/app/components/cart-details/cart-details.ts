import { Component, inject } from '@angular/core';
import { CartItem } from '../../common/cart-item';
import { CartService } from '../../services/cart';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-cart-details',
  imports: [CurrencyPipe],
  templateUrl: './cart-details.html',
  styleUrl: './cart-details.css',
})
export class CartDetails {
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  totalQuantity: number = 0;
  private cartService = inject(CartService);

  constructor() {
    this.listCartDetails();
  }

  listCartDetails() {
    this.cartItems = this.cartService.cartItems;

    this.cartService.totalPrice.subscribe(
      data => this.totalPrice = data
    );

    this.cartService.totalQuantity.subscribe(
      data => this.totalQuantity = data
    );

    this.cartService.computeCartTotals();
  }

  incrementQuantity(cartItem: CartItem) {
    this.cartService.addToCart(cartItem);
  }

  decrementQuantity(cartItem: CartItem) {
    this.cartService.decrementQuantity(cartItem);
  }

  removeItem(cartItem: CartItem) {
    this.cartService.remove(cartItem);
  }
}
