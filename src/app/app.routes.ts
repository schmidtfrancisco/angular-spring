import { Routes } from '@angular/router';
import { ProductList } from './components/product-list/product-list';
import { ProductDetails } from './components/product-details/product-details';
import { CartDetails } from './components/cart-details/cart-details';
import { Checkout } from './components/checkout/checkout';

export const routes: Routes = [
  {
    path: 'products/:id',
    component: ProductDetails
  },
  {
    path: 'search/:keyword',
    component: ProductList
  },
  {
    path: 'category/:id',
    component: ProductList
  },
  {
    path: 'category',
    component: ProductList
  },
  {
    path: 'products',
    component: ProductList
  },
  {
    path: 'cart-details',
    component: CartDetails
  },
  {
    path: 'checkout',
    component: Checkout
  },
  {
    path: '',
    redirectTo: '/products',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/products',
    pathMatch: 'full'
  }
];
