import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { email } from '@angular/forms/signals';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  totalPrice: number = 0;
  totalQuantity: number = 0;

  checkoutForm = new FormGroup({
    customer: new FormGroup({
      firstName: new FormControl(''),
      lastName: new FormControl(''),
      email: new FormControl('')
    }),
    shippingAddress: new FormGroup({
      street: new FormControl(''),
      city: new FormControl(''),
      state: new FormControl(''),
      country: new FormControl(''),
      zipCode: new FormControl('')
    }),
    billingAddress: new FormGroup({
      street: new FormControl(''),
      city: new FormControl(''),
      state: new FormControl(''),
      country: new FormControl(''),
      zipCode: new FormControl('')
    }),
    creditCard: new FormGroup({
      cardType: new FormControl(''),
      nameOnCard: new FormControl(''),
      cardNumber: new FormControl(''),
      securityCode: new FormControl(''),
      expirationMonth: new FormControl(''),
      expirationYear: new FormControl('')
    })
  })

  onSubmit() {
    console.log("Handling form submit");
    console.log(this.checkoutForm.get('customer')?.value);
  }

  copyShippingAddressToBilling(event: any) {
    if (event.target.checked) {
      this.checkoutForm.controls.billingAddress
      .patchValue(this.checkoutForm.controls.shippingAddress.value);
    }
    else {
      this.checkoutForm.controls.billingAddress.reset();
    }
  }
}
