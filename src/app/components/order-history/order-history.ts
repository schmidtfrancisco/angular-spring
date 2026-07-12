import { Component, inject } from '@angular/core';
import { OrderHistoryService } from '../../services/order-history';
import { OrderHistory } from '../../common/order-history';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-order-history',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css',
})
export class OrderHistoryComponent {
  orderHistoryList: OrderHistory[] = [];
  storage: Storage = sessionStorage;
  private orderHistoryService = inject(OrderHistoryService);

  constructor() {
    this.handleOrderHistory();
  }

  handleOrderHistory() {
    const userEmail = JSON.parse(this.storage.getItem('userEmail')!);
    console.log(userEmail);

    this.orderHistoryService.getOrderHistory(userEmail).subscribe(
      data => {
        console.log(data)
        this.orderHistoryList = data._embedded.orders;
        console.log(this.orderHistoryList)
      }
    );
  }
}
