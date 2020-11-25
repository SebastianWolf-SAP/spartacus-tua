import { Component, Input } from '@angular/core';
import { TmaProductOfferingPrice } from '../../../../../core/model';

@Component({
  selector: 'cx-recurring-charge',
  templateUrl: './tma-recurring-charge.component.html',
})
export class TmaRecurringChargeComponent{

  @Input()
  recurringCharge: TmaProductOfferingPrice;

  constructor(
  ) { }

}