import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShopeandoFormService } from '../../services/shopeando-form';
import { Country } from '../../common/country';
import { State } from '../../common/state';
import { ShopeandoValidators } from '../../validators/shopeando-validators';
import { CartService } from '../../services/cart';
import { CheckoutService } from '../../services/checkout';
import { Router } from '@angular/router';
import { Order } from '../../common/order';
import { OrderItem } from '../../common/order-item';
import { Purchase } from '../../common/purchase';
import { Customer } from '../../common/customer';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  totalPrice: number = 0;
  totalQuantity: number = 0;
  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];
  countries: Country[] = [];
  shippingStates: State[] = [];
  billingStates: State[] = [];
  storage: Storage = sessionStorage;

  private shopeandoFormService = inject(ShopeandoFormService);
  private cartService = inject(CartService);
  private formBuilder = inject(FormBuilder);
  private checkoutService = inject(CheckoutService);
  private router = inject(Router);

  checkoutForm = this.formBuilder.nonNullable.group({
    customer: this.formBuilder.nonNullable.group({
      firstName: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]],
      lastName: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]],
      email: [JSON.parse(this.storage.getItem('userEmail')!) || '', [Validators.required, Validators.email, ShopeandoValidators.notOnlyWhitespace]]
    }),
    shippingAddress: this.formBuilder.nonNullable.group({
      street: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]],
      city: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]],
      state: ['', [Validators.required]],
      country: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]]
    }),
    billingAddress: this.formBuilder.nonNullable.group({
      street: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]],
      city: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]],
      state: ['', [Validators.required]],
      country: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]]
    }),
    creditCard: this.formBuilder.nonNullable.group({
      cardType: ['', [Validators.required]],
      nameOnCard: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]],
      cardNumber: ['', [Validators.required, Validators.pattern('[0-9]{16}')]],
      securityCode: ['', [Validators.required, Validators.pattern('[0-9]{3}')]],
      expirationMonth: [''],
      expirationYear: ['']
    })
  });

  constructor() {
    const startMonth: number = new Date().getMonth() + 1;
    this.shopeandoFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        this.creditCardMonths = data
      }
    );

    this.shopeandoFormService.getCreditCardYears().subscribe(
      data => {
        this.creditCardYears = data
      }
    );

    this.shopeandoFormService.getCountries().subscribe(
      data => {
        this.countries = data
      }
    );

    this.reviewCartDetails();
    
  }

  get firstName() { return this.checkoutForm.get('customer.firstName'); }
  get lastName() { return this.checkoutForm.get('customer.lastName'); }
  get email() { return this.checkoutForm.get('customer.email'); }
  get shippingStreet() { return this.checkoutForm.get('shippingAddress.street'); }
  get shippingCity() { return this.checkoutForm.get('shippingAddress.city'); }
  get shippingState() { return this.checkoutForm.get('shippingAddress.state'); }
  get shippingCountry() { return this.checkoutForm.get('shippingAddress.country'); }
  get shippingZipCode() { return this.checkoutForm.get('shippingAddress.zipCode'); }
  get billingStreet() { return this.checkoutForm.get('billingAddress.street'); }
  get billingCity() { return this.checkoutForm.get('billingAddress.city'); }
  get billingState() { return this.checkoutForm.get('billingAddress.state'); }
  get billingCountry() { return this.checkoutForm.get('billingAddress.country'); }
  get billingZipCode() { return this.checkoutForm.get('billingAddress.zipCode'); }
  get cardType() { return this.checkoutForm.get('creditCard.cardType'); }
  get nameOnCard() { return this.checkoutForm.get('creditCard.nameOnCard'); }
  get cardNumber() { return this.checkoutForm.get('creditCard.cardNumber'); }
  get cardSecurityCode() { return this.checkoutForm.get('creditCard.securityCode'); }

  onSubmit() {
    console.log("Handling form submit");

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    let order = new Order(this.totalQuantity, this.totalPrice);
    console.log(`Order: ${JSON.stringify(order)}`);

    const cartItems = this.cartService.cartItems;
    let orderItems: OrderItem[] = cartItems.map(item => new OrderItem(item));

    const customer: Customer = this.checkoutForm.controls.customer.getRawValue();

    const shippingAddress = this.checkoutForm.controls.shippingAddress.getRawValue();
    const shippingState: State = JSON.parse(JSON.stringify(shippingAddress.state));
    const shippingCountry: Country = JSON.parse(JSON.stringify(shippingAddress.country));
    shippingAddress.state = shippingState.name;
    shippingAddress.country = shippingCountry.name;

    const billingAddress = this.checkoutForm.controls.billingAddress.getRawValue();
    const billingState: State = JSON.parse(JSON.stringify(billingAddress.state));
    const billingCountry: Country = JSON.parse(JSON.stringify(billingAddress.country));
    billingAddress.state = billingState.name;
    billingAddress.country = billingCountry.name;

    let purchase = new Purchase(customer, shippingAddress, billingAddress, order, orderItems);

    this.checkoutService.placeOrder(purchase).subscribe({
      next: response => {
        alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);
        this.resetCart();
      },
      error: err => {
        alert(`There was an error: ${err.message}`);
      }
    });
  }

  resetCart() {
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);

    this.checkoutForm.reset();

    this.router.navigateByUrl("/products");
  }

  copyShippingAddressToBilling(event: any) {
    if (event.target.checked) {
      this.checkoutForm.controls.billingAddress
        .patchValue(this.checkoutForm.controls.shippingAddress.value);

      this.billingStates = this.shippingStates;
    }
    else {
      this.checkoutForm.controls.billingAddress.reset();
      this.billingStates = [];
    }
  }

  handleMonthsAndYears() {
    const creditCardFormGroup = this.checkoutForm.get('creditCard');
    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = Number(creditCardFormGroup?.value.expirationYear);

    let startMonth: number;

    if (currentYear === selectedYear) {
      startMonth = new Date().getMonth() + 1;
    }
    else {
      startMonth = 1;
    }

    this.shopeandoFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        this.creditCardMonths = data
      }
    );
  }

  getStates(formGroupName: string) {
    const formGroup = this.checkoutForm.get(formGroupName);
    const countryCode = formGroup?.value.country.code;
    console.log(`${formGroupName} country code: ${countryCode}`);

    this.shopeandoFormService.getStates(countryCode).subscribe(
      data => {
        if (formGroupName === 'shippingAddress') {
          this.shippingStates = data;
        }
        else {
          this.billingStates = data;
        }

        formGroup?.get('state')?.setValue(data[0]);
      }
    )
  }

  reviewCartDetails() {
    this.cartService.totalQuantity.subscribe(
      data => this.totalQuantity = data
    );

    this.cartService.totalPrice.subscribe(
      data => this.totalPrice = data
    );
  }
}
