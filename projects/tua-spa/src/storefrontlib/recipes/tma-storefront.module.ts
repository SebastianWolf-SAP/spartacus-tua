import { ModuleWithProviders, NgModule } from '@angular/core';
import {
  MainModule,
  StorefrontFoundationModule,
  StorefrontModule,
} from '@spartacus/storefront';
import { provideConfig } from '@spartacus/core';
import { TmaStorefrontConfig } from '../tma-storefront-config';
import { TmaStorefrontFoundationModule } from './tma-storefront-foundation.module';
import { TmaOccModule } from '../../core/occ';
import { TmfModule } from '../../core/tmf';
import { TmfAppointmentModule } from '../../core/tmf-appointment';


@NgModule({
  imports: [
    TmaOccModule.forRoot(),
    TmfModule.forRoot(),
    TmfAppointmentModule.forRoot(),
  ],
  exports: [
    MainModule,
    StorefrontFoundationModule,
    TmaStorefrontFoundationModule,
  ],
})
export class TmaStorefrontModule extends StorefrontModule {
  static withConfig(
    config?: TmaStorefrontConfig
  ): ModuleWithProviders<TmaStorefrontModule> {
    return {
      ngModule: TmaStorefrontModule,
      providers: [provideConfig(config)],
    };
  }
}
