import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nTestingModule } from '@spartacus/core';
import { Observable, of } from 'rxjs';
import { TmaProductSummaryComponent } from './tma-product-summary.component';
import { TmaProduct } from '../../../../core/model/tma-product.model';
import {
  AddToCartModule,
  CurrentProductService,
  ItemCounterModule,
  OutletDirective,
  ProductSummaryComponent
} from '@spartacus/storefront';
import { TmaPriceModule } from '../price';
import { TmaPriceDisplayModule } from '../price/price-display/tma-price-display.module';
import { TmaDiscountDisplayModule } from '../../../shared/components/discount-display';

class MockCurrentProductService {
  getProduct(): Observable<TmaProduct> {
    return of();
  }
}

describe('TmaProductSummaryComponent in product', () => {
  let productSummaryComponent: TmaProductSummaryComponent;
  let fixture: ComponentFixture<TmaProductSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        AddToCartModule,
        ItemCounterModule,
        I18nTestingModule,
        TmaPriceModule,
        TmaPriceDisplayModule,
        TmaDiscountDisplayModule
      ],
      declarations: [
        TmaProductSummaryComponent,
        ProductSummaryComponent,
        OutletDirective
      ],
      providers: [
        { provide: CurrentProductService, useClass: MockCurrentProductService }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TmaProductSummaryComponent);
    productSummaryComponent = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(TmaProductSummaryComponent).toBeTruthy();
  });
});
