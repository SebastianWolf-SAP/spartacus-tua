import * as SearchTimeSlotActions from '../store/actions/search-time-slot.action';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SearchTimeSlot, TimeSlot } from '../../model';
import { Store, select } from '@ngrx/store';
import * as SearchTimeSlotSelectors from '../store/selectors/search-time-slot.selector';
import { LOCAL_STORAGE } from '../../util';
import { StateWithSearchTimeSlot } from '../store';

const { END_DATE_OF_TIMESLOTS } = LOCAL_STORAGE.APPOINTMENT;

@Injectable({
  providedIn: 'root',
})
export class SearchTimeSlotService {
  constructor(protected store: Store<StateWithSearchTimeSlot>) {}

  /**
   * Returns the available time slots.
   * @returns time slots as an {@link Observable} of {@link SearchTimeSlot}
   */
  getAvailableTimeSlots(): Observable<SearchTimeSlot> {
    this.loadSearchTimeSlot();
    return this.store.pipe(
      select(SearchTimeSlotSelectors.getAllSearchTimeSlots)
    );
  }

  /**
   * Loads the available time slots.
   */
  loadSearchTimeSlot(): void {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + END_DATE_OF_TIMESLOTS);

    const searchTimeSlotRequest: SearchTimeSlot = {
      requestedTimeSlot: [
        {
          validFor: {
            startDateTime: startDate,
            endDateTime: endDate,
          },
        },
      ],
    };
    this.store.dispatch(
      new SearchTimeSlotActions.LoadSearchTimeSlot({
        requestedTimeSlot: searchTimeSlotRequest,
      })
    );
  }

  /**
   * Sets the selected time slot.
   * @param  timeSlot The selected time slot of {@link TimeSlot}
   */
  setSelectedTimeSlot(timeSlot: TimeSlot): void {
    if (!!timeSlot) {
      this.store.dispatch(
        new SearchTimeSlotActions.SelectedTimeSlotSucess({ timeSlot })
      );
    }
  }

  /**
   * Gets the selected time slot
   * @returns timeSlot The selected time slot as an {@link Observable} of {@link TimeSlot}
   */
  getSelectedTimeSlot(): Observable<TimeSlot> {
    return this.store.select(SearchTimeSlotSelectors.getSelectedTimeSlots);
  }
}
