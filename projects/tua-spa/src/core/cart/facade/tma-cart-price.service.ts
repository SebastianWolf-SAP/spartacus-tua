import { Injectable, OnDestroy } from '@angular/core';
import {
  TmaChargeType,
  TmaCartItemPrice,
  TmaCartPrice,
  TmaPriceType,
  TmaCartTotalPrice,
  TmaOrder,
  TmaCart,
  TmaOrderEntry,
  TmaBillingTimeType
} from '../../model';
import { TmaItem } from '../../../storefrontlib/cms-components/cart/cart-shared';
import { TranslationService, Price } from '@spartacus/core';
import { first, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LOCAL_STORAGE } from '../../util';

const {
  RANGE
} = LOCAL_STORAGE.DECIMAL;

@Injectable({
  providedIn: 'root'
})
export class TmaCartPriceService implements OnDestroy {

  protected cartItemPrice: TmaCartItemPrice = {} as TmaCartItemPrice;
  protected cartTotalPrice: TmaCartTotalPrice = {} as TmaCartTotalPrice;
  protected destroyed$ = new Subject();
  protected allPrices: TmaCartPrice[] = [];

  private payOnCheckoutPrice: number;
  private payOnCheckoutDiscount: number;
  private discountedPayOnCheckoutPrice: number;

  constructor(
    protected translationService: TranslationService
  ) {}

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  /**
   * Returns an object that contains the prices (pay on checkout, recurring, usage charges, one time charges which are not pay now) of a cart entry.
   *
   * @param item - the cart entry
   * @return A {@link TmaCartItemPrice} containing the prices for the entry
   */
  computeEntryPrice(item: TmaItem): TmaCartItemPrice {
    const PARENT_ID = 'parentId';
    this.cartItemPrice.recurringPrices = [];
    this.cartItemPrice.usageChargePrices = [];
    this.cartItemPrice.oneTimeChargePrices = [];
    this.payOnCheckoutPrice = 0;
    this.payOnCheckoutDiscount = 0;
    this.discountedPayOnCheckoutPrice = 0;
    this.allPrices = [];
    this.flattenPriceTreeWithDiscount(item.cartPrice,null,[]);
    this.computeEntryPriceTypes(this.allPrices, '');
    this.cartItemPrice.recurringPrices.sort((a, b) => (Number(a.cycle.cycleStart) > Number(b.cycle.cycleStart)) ? 1 : -1);
    this.cartItemPrice.oneTimeChargePrices.sort((a, b) => (a.recurringChargePeriod < b.recurringChargePeriod) ? 1 : -1);
    this.cartItemPrice.usageChargePrices = this.groupBy(this.cartItemPrice.usageChargePrices.sort((x, y) =>
      (x.unitOfMeasure > y.unitOfMeasure ? 1 : (x.unitOfMeasure === y.unitOfMeasure ?
        ((Number(x.tierStart) > Number(y.tierStart) || x.tierStart === undefined) ? 1 : -1) : -1))), PARENT_ID);

    this.cartItemPrice.payOnCheckoutPrice = Number((this.payOnCheckoutPrice * item.quantity + this.discountedPayOnCheckoutPrice).toFixed(RANGE));
    this.cartItemPrice.payOnCheckoutDiscount = this.payOnCheckoutDiscount * item.quantity;
    return this.cartItemPrice;
  }

  /**
   * Returns the cart/order subtotal price.
   *
   * @param cart - the cart or order object
   * @return The subtotal price of the cart
   */
  computeSubTotalCartPrice(cart: TmaCart | TmaOrder): number {
    let payOnCheckoutSubTotal = 0;

    if (!cart.entries) {
      return Number(payOnCheckoutSubTotal.toFixed(RANGE));
    }

    cart.entries.forEach((entry: TmaOrderEntry) =>
      payOnCheckoutSubTotal += this.computeCartEntryPrice(entry.cartPrice.cartPrice, entry.quantity)
    );

    return Number(payOnCheckoutSubTotal.toFixed(RANGE));
  }

  /**
   * Returns an object that contains the cart/order price (subtotal, total, delivery cost).
   *
   * @param cart - the cart or order object
   * @return A {@link TmaCartTotalPrice} containing the subtotal and total price of the cart
   */
  computeCartTotalPrice(cart: TmaCart | TmaOrder): TmaCartTotalPrice {
    this.cartTotalPrice.deliveryCost = 0;
    this.cartTotalPrice.payOnCheckoutSubTotal = this.computeSubTotalCartPrice(cart);

    this.computeTotalCartPrice(cart);
    this.cartTotalPrice.payOnCheckoutTotal = Number(this.cartTotalPrice.payOnCheckoutTotal.toFixed(RANGE));

    return this.cartTotalPrice;
  }

  /**
   * Returns the formatted form of the price provided (as $ 15.00)
   *
   * @param price The price to be formatted
   * @return formatted price
   */
  getFormattedPrice(price: Price): string {
    let currencySymbol: string = null;

    if (!price || !price.currencyIso || !price.value) {
      return '-';
    }

    this.translationService
      .translate('common.currencies.currency', { context: price.currencyIso })
      .pipe(
        first((currency: string) => currency !== null),
        takeUntil(this.destroyed$)
      )
      .subscribe((currency: string) => (currencySymbol = currency));

    return currencySymbol + ' ' + Number(price.value).toFixed(RANGE);
  }

  /**
   * Returns the final price after applying alterations
   * (TmaPrice has one time $10, and has alterations of $2 , so final price is $8)
   *
   * @param cartItemPrice
   *            TmaCartPrice - cart price
   * @return The actual calculated price as {@link Price}
   */
  calculatePrice(cartItemPrice: TmaCartPrice): Price {
    let calculatedPrice: number = cartItemPrice.taxIncludedAmount.value;
    if (cartItemPrice.priceAlteration !== undefined && cartItemPrice.priceAlteration.find((alteration:TmaCartPrice) => alteration.cycle) === undefined) {
      cartItemPrice.priceAlteration.forEach((discount: TmaCartPrice) => {
        if (discount.price.percentage) {
          calculatedPrice =
            Number(calculatedPrice) *
            (1 - Number(discount.price.percentage) / 100);
        } else {
          calculatedPrice =
            Number(calculatedPrice) -
            Number(discount.price.taxIncludedAmount.value);
        }
      });
      return {
        value: calculatedPrice,
        currencyIso: cartItemPrice.taxIncludedAmount.currencyIso
      };
    }
    return {
      value: calculatedPrice,
      currencyIso: cartItemPrice.taxIncludedAmount.currencyIso
    };
  }

  /**
   * Return the total discount applied on a price
   * (OriginalPrice is 10, and has discountedPrice is 8, so total discount available is 2)
   *
   * @param originalPrice
   *                Original Price of an offering
   * @param discountedPrice
   *                Discounted Price of an offering
   * @return Total applied discount on the original price
   */
  calculateTotalDiscount(originalPrice: number, discountedPrice: number): number {
    return ((originalPrice - discountedPrice));
  }

  /**
   * Returns the list of all alternations for a charge , if any alternation has cycle attached.
   *
   * @param charge
   *              Charge for which alterations are to be listed
   * @return Price Alternation list applicable for charge
   */
  getCycledPriceAlterations(charge: TmaCartPrice): TmaCartPrice[] {
    if (charge.priceAlteration.find((alteration: TmaCartPrice) => alteration.cycle)) {
      return charge.priceAlteration;
    }
  }

  /**
   * This method transforms the price and price alteration composite structure to a simplified array of prices with alterations
   * @param price
   *              Charge for which alterations are to be listed
   * @param parent
   *              root price
   * @param priceAlterations
   *              price alternations
   */
  protected flattenPriceTreeWithDiscount(price: TmaCartPrice, parent: TmaCartPrice, priceAlterations: TmaCartPrice[]): void {
    if (price === null) {
      return;
    }

    if (!price.cartPrice) {
      price.priceAlteration = price.priceAlteration.filter((alteration: TmaCartPrice) => !!alteration && alteration.recurringChargePeriod === price.recurringChargePeriod)
        .reverse();
      this.allPrices.push(price);
      return;
    }
    const cartPrices = price.cartPrice.filter((cartPrice: TmaCartPrice) => cartPrice.priceType === undefined || cartPrice.priceType !== 'DISCOUNT_PRICE_ALTERATION');
    cartPrices.forEach((pop: TmaCartPrice) => {
      const popCopy = Object.assign({}, parent ? { ...pop, ...parent } : pop);
      popCopy.priceAlteration = priceAlterations.concat(pop.priceAlteration);
      const popParent = pop.cartPrice && pop.cartPrice.length !== 0 ? Object.assign({}, pop) : null;
      if (pop.cartPrice) {
        popCopy.cartPrice = pop.cartPrice;
      }
      if (popParent) {
        popParent.cartPrice = null;
      }
      if (pop.priceType !== 'DISCOUNT_PRICE_ALTERATION') {
        this.flattenPriceTreeWithDiscount(popCopy, popParent, popCopy.priceAlteration);
      }
    });
  }

  protected computeEntryPriceTypes(cartPrices: TmaCartPrice[], id?: string): void {
    cartPrices.forEach((price: TmaCartPrice) => {
      if (Array.isArray(price.cartPrice)) {
        this.computeEntryPriceTypes(price.cartPrice, price.id);
        return;
      }
      if (this.isOneTimePrice(price.chargeType)) {
        this.computeOneTimePrice(price);
      }
      if (this.isRecurringPrice(price.chargeType)) {
        this.cartItemPrice.recurringPrices.push(price);
      }
      if (this.isUsagePrice(price.chargeType)) {
        const newPrice = Object.assign({}, price);
        newPrice.parentId = id;
        this.cartItemPrice.usageChargePrices.push(newPrice);
      }
    });
  }

  protected isOneTimePrice(chargeType: string): boolean {
    return chargeType === TmaChargeType.ONE_TIME;
  }

  protected isRecurringPrice(chargeType: string): boolean {
    return chargeType === TmaChargeType.RECURRING;
  }

  protected isUsagePrice(chargeType: string): boolean {
    return chargeType === TmaChargeType.USAGE;
  }

  protected computeOneTimePrice(price: TmaCartPrice): void {
    if (price.recurringChargePeriod === TmaBillingTimeType.PAY_NOW) {
      if (price.priceType === TmaPriceType.DISCOUNT) {
        this.discountedPayOnCheckoutPrice += Number(price.taxIncludedAmount.value);
        return;
      }
      this.payOnCheckoutPrice += Number(price.taxIncludedAmount.value);
      this.computePayOnCheckoutDiscount(price);
      return;
    }
    this.cartItemPrice.oneTimeChargePrices.push(price);
  }

  /**
   * This method returns the price discount applied on payOncheckout charge
   *
   * @param price
   *              Charge for which discount are be to calculated
   *
   * @returns pay on checkout discount
   */
  protected computePayOnCheckoutDiscount(price: TmaCartPrice): number {
    let entryPrice = price.taxIncludedAmount.value;
    price.priceAlteration.forEach((discount: TmaCartPrice) => {
      if (discount.price.percentage) {
        this.payOnCheckoutDiscount += Number(entryPrice) * Number(discount.price.percentage) / 100;
        entryPrice = Number(entryPrice) * (1 - (Number(discount.price.percentage) / 100));
      }
      else {
        this.payOnCheckoutDiscount += Number(discount.price.taxIncludedAmount.value);
        entryPrice = Number(entryPrice) - Number(discount.price.taxIncludedAmount.value);
      }
    });
    return this.payOnCheckoutDiscount;
  }

  protected computeTotalCartPrice(cart: TmaCart | TmaOrder): void {
    this.cartTotalPrice.payOnCheckoutTotal = this.cartTotalPrice.payOnCheckoutSubTotal;
    const prices = 'cartCosts' in cart ? cart.cartCosts : (<TmaOrder>cart).orderCosts;

    if (!prices) {
      return;
    }

    prices.forEach((cartCost: TmaCartPrice) =>
      this.computeCartPrice(cartCost.cartPrice)
    );
  }

  protected computeCartPrice(priceList: TmaCartPrice[]): void {
    if (!priceList || priceList.length === 0) {
      return;
    }

    priceList.forEach((price: TmaCartPrice) => {
        this.computeCartPrice(price.cartPrice);

        if (price.recurringChargePeriod !== TmaBillingTimeType.PAY_NOW) {
          return;
        }

        this.cartTotalPrice.payOnCheckoutTotal += Number(price.taxIncludedAmount.value);

        if (price.priceType === TmaPriceType.DELIVERY_COST) {
          this.cartTotalPrice.deliveryCost = price.taxIncludedAmount.value;
        }
      }
    );
  }

  protected computeCartEntryPrice(cartPrice: TmaCartPrice[], quantity: number): number {
    let entryTotalPrice = 0;
    let discountedEntryTotalPrice = 0;

    cartPrice.forEach((price: TmaCartPrice) => {
      if (price.recurringChargePeriod === TmaBillingTimeType.PAY_NOW) {
        if (price.priceType === TmaPriceType.DISCOUNT) {
          discountedEntryTotalPrice += Number(price.taxIncludedAmount.value);
        }
        else {
          entryTotalPrice += Number(price.taxIncludedAmount.value);
        }
      }
    });

    entryTotalPrice = entryTotalPrice * quantity + discountedEntryTotalPrice;
    return entryTotalPrice;
  }

  protected groupBy(list: any[], field: string): any {
    return list.reduce(function (l: any[], f: string) {
      (l[f[field]] = l[f[field]] || []).push(f);
      return l;
    }, {});
  }
}
