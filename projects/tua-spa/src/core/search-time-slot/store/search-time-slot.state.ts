import { SearchTimeSlot, TimeSlot } from '../../model';
import { StateUtils } from '@spartacus/core';

export const SEARCH_TIME_SLOT_FEATURE = 'Search-TimeSlot';
export const SEARCH_TIME_SLOT_DATA = '[Search-TimeSlot] SearchTimeSlot Data';

export interface StateWithSearchTimeSlot {
  [SEARCH_TIME_SLOT_FEATURE]: SearchTimeSlotState;
}

export interface SearchTimeSlotState {
  selectedTimeSlot?: TimeSlot;
  searchTimeSlots?: StateUtils.LoaderState<SearchTimeSlot>;
}
