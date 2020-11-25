import { AppointmentState, APPOINTMENT_DATA, AppointmentError } from '../appointment-state';
import { ActionReducerMap } from '@ngrx/store';
import { InjectionToken, Provider } from '@angular/core';
import {
  appointmentReducer,
  createAppointmentReducer,
  appointmentErrorReducer,
  updateAppointmentErrorReducer,
} from './appointment.reducer';
import { Appointment } from '../../..';
import { StateUtils } from '@spartacus/core';

export function getReducers(): ActionReducerMap<AppointmentState> {
  return {
    appointments: StateUtils.loaderReducer<Appointment[]>(
      APPOINTMENT_DATA,
      appointmentReducer
    ),
    newAppointment: StateUtils.loaderReducer<Appointment>(
      APPOINTMENT_DATA,
      createAppointmentReducer
    ),
    error: StateUtils.loaderReducer<AppointmentError[]>(
      APPOINTMENT_DATA,
      appointmentErrorReducer
    ),
    updateAppointmentError: StateUtils.loaderReducer<AppointmentError>(
      APPOINTMENT_DATA,
      updateAppointmentErrorReducer
    ),
  };
}

export const reducerToken: InjectionToken<ActionReducerMap<
  AppointmentState
>> = new InjectionToken<ActionReducerMap<AppointmentState>>(
  'appointmentReducer'
);

export const reducerProvider: Provider = {
  provide: reducerToken,
  useFactory: getReducers,
};