import { TmaTmfProductOffering } from './tma-tmf-shopping-cart.model';
import { TmaProductOfferingPrice } from './tma-product.model';

export interface Recommendation {
  id?: string;
  name?: string;
  href?: string;
  item?: RecommendationItem[];
}

export interface RecommendationItem {
  offering?: TmaTmfProductOffering;
  price?: TmaProductOfferingPrice;
}