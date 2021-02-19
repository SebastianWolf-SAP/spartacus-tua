import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { TmfProductService } from '../../../../../core/subscription/tmf-product/facade';
import {
  TmfProduct,
  TmfProductRelatedPartyRole,
  TmfProductStatus,
  TmaOrderEntry,
  TmaCartItemPrice,
  TmaOrder,
  TmaTmfRelatedParty,
} from '../../../../../core/model';
import {
  UserOrderService,
  CurrencyService,
  User,
  UserService,
} from '@spartacus/core';
import { filter, takeUntil } from 'rxjs/operators';
import { TmaCartPriceService } from '../../../../../core/cart/facade';
import { TmaItem } from '../../../cart/cart-shared';

@Component({
  selector: 'cx-tmf-product',
  templateUrl: './tmf-product.component.html',
  styleUrls: ['./tmf-product.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class TmfProductComponent implements OnInit, OnDestroy {
  @Input()
  tmfProductId: string;
  @Input()
  tmfProduct: TmfProduct;
  @Input()
  order?: TmaOrder;

  tmfProductDetail$: Observable<TmfProduct>;
  currency$: Observable<string>;
  isOwner: boolean;
  protected user: User;
  protected destroyed$ = new Subject();

  constructor(
    public priceService: TmaCartPriceService,
    protected tmfProductService: TmfProductService,
    protected userOrderService: UserOrderService,
    protected currencyService: CurrencyService,
    protected userService: UserService
  ) {}

  ngOnInit(): void {
    this.currency$ = this.currencyService.getActive();
    this.userService
      .get()
      .pipe(
        filter((customer: User) => !!customer),
        takeUntil(this.destroyed$)
      )
      .subscribe((customer: User) => (this.user = customer));
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.tmfProductService.clearTmfProductDetails();
  }

  getProductOrderEntry(order: TmaOrder, entryNumber: string): TmaOrderEntry {
    let userOrderEntry: TmaOrderEntry;
    if (!!order && !!order.entries) {
      userOrderEntry = this.getEntry(order.entries, entryNumber);
    }
    return userOrderEntry;
  }

  /**
   * Filters the order entry list with a given entry number.   * 
   *
   * @param entries the list of order entries.
   *
   * @return order entry as {@link TmaOrderEntry}.
   */
  getEntry(entries: TmaOrderEntry[], entryNumber: string): TmaOrderEntry {
    let orderEntry: TmaOrderEntry;
    if (entries) {
      entries.forEach((entry: TmaOrderEntry) => {
        if (entry.entryNumber.toString() === entryNumber) {
          orderEntry = entry;
          return;
        } else {
          let productOrderEntry: TmaOrderEntry;
          productOrderEntry = this.getEntry(entry.entries, entryNumber);
          if (productOrderEntry) {
            orderEntry = productOrderEntry;
            return;
          }
        }
      });
    }
    return orderEntry;
  }

  getPrices(entry: TmaOrderEntry): TmaCartItemPrice {
    if (!!entry) {
      const item: TmaItem = { entryNumber: null };
      Object.assign(item, entry);
      return this.priceService.computeEntryPrice(item);
    }
  }

  getRole(relatedParty: TmaTmfRelatedParty[]): boolean {
    relatedParty.forEach((customer) => {
      if (customer.id === this.user.uid) {
        this.isOwner = customer.role === TmfProductRelatedPartyRole.OWNER;
      }
    });
    return this.isOwner;
  }

  getProductStatus(product: TmfProduct): boolean {
    if (product.status) {
      if (product.status.toUpperCase() === TmfProductStatus.ACTIVE) {
        return true;
      }
      if (product.status.toUpperCase() === TmfProductStatus.CANCELLED) {
        return false;
      }
    }
  }
}
