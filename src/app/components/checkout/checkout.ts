import { CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, inject } from '@angular/core';
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
import { environment } from '../../../environments/environment';
import { loadStripe, PaymentIntentResult, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { PaymentInfo } from '../../common/payment-info';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements AfterViewInit{
  totalPrice: number = 0;
  totalQuantity: number = 0;
  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];
  countries: Country[] = [];
  shippingStates: State[] = [];
  billingStates: State[] = [];
  storage: Storage = sessionStorage;
  stripe: Stripe | null = null;
  paymentInfo: PaymentInfo = new PaymentInfo();
  cardElement: StripeCardElement | null = null;
  displayError: HTMLElement | null = null;
  isDisabled: boolean = false;

  private shopeandoFormService = inject(ShopeandoFormService);
  private cartService = inject(CartService);
  private formBuilder = inject(FormBuilder);
  private checkoutService = inject(CheckoutService);
  private router = inject(Router);

  checkoutForm = this.formBuilder.nonNullable.group({
    customer: this.formBuilder.nonNullable.group({
      firstName: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]],
      lastName: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]],
      email: ['', [Validators.required, Validators.email, ShopeandoValidators.notOnlyWhitespace]]
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
      // cardType: ['', [Validators.required]],
      // nameOnCard: ['', [Validators.required, Validators.minLength(2), ShopeandoValidators.notOnlyWhitespace]],
      // cardNumber: ['', [Validators.required, Validators.pattern('[0-9]{16}')]],
      // securityCode: ['', [Validators.required, Validators.pattern('[0-9]{3}')]],
      // expirationMonth: [''],
      // expirationYear: ['']
    })
  });

  constructor() {
    this.shopeandoFormService.getCountries().subscribe(
      data => {
        this.countries = data
      }
    );

    this.reviewCartDetails();

  }

  async ngAfterViewInit() {
    await this.initializeStripe();
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

  async initializeStripe() {
    this.stripe = await loadStripe("pk_test_51TsNMVGT2jfm9H3lHPhOm8G9D4WE3Oymuo3v26wlQePfkwLRwOkGZMIE459VR075bOITuSQiFqZUrlhcyiiS4G8S00NI8rUxu7");

    if (!this.stripe)
      return

    var elements = this.stripe.elements();

    this.cardElement = elements.create('card', { hidePostalCode: true });
    this.cardElement.mount('#card-element');

    this.cardElement.on('change', (event: any) => {
      this.displayError = document.getElementById('card-errors');

      if (event.complete && this.displayError) {
        this.displayError.textContent = "";
      } else if (event.error && this.displayError) {
        this.displayError.textContent = event.error.message
      }
    });
  }

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

    this.paymentInfo.amount = this.totalPrice * 100;
    this.paymentInfo.currency = "USD";
    this.paymentInfo.receiptEmail = purchase.customer.email;

    if (this.displayError && this.displayError.textContent === '') {
      this.isDisabled = true;
      this.checkoutService.createPaymentIntent(this.paymentInfo).subscribe(
        (paymentIntentResponse) => {
          this.stripe?.confirmCardPayment(paymentIntentResponse.client_secret, {
            payment_method: {
              card: this.cardElement!,
              billing_details: {
                email: purchase.customer.email,
                name: `${purchase.customer.firstName} ${purchase.customer.lastName}`,
                address: {
                  line1: purchase.billingAddress.street,
                  city: purchase.billingAddress.city,
                  state: purchase.billingAddress.state,
                  postal_code: purchase.billingAddress.zipCode,
                  country: billingCountry.code
                }
              }
            },
          }, { handleActions: false })
          .then((result: PaymentIntentResult) => {
            if (result.error) {
              alert(`There was an error: ${result.error.message}`);
              this.isDisabled = false;
            } else {
              this.checkoutService.placeOrder(purchase).subscribe({
                next: (response: any) => {
                  alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);
                  this.resetCart(); 
                  this.isDisabled = false;
                },
                error: (err: any) => {
                  alert(`There was an error: ${err.message}`);
                  this.isDisabled = false;
                } 
              })
            }
          })
        }
      );
    } else {
      this.checkoutForm.markAllAsTouched();
      return;
    }
  }

  resetCart() {
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    this.cartService.persistCartItems();

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
