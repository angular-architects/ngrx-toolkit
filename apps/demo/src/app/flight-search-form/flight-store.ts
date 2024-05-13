import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  withDevtools,
  withForm, ControlChange, FormState, Reset, SetValue
} from 'ngrx-toolkit';
import { computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Flight } from './flight';

export const FlightStore = signalStore(
  { providedIn: 'root' },
  withDevtools('flights'),
  withState({ flights: [] as Flight[] }),
  withForm('flightsSearch', 500),
  withComputed(({ flightsSearchFormState }) => {
    return {

      // -------- FORM MANAGEMENT -------
      flightsSearchFormComputedChanges: computed<ControlChange[]>(() => {
        const formState: FormState = flightsSearchFormState();
        const changes: ControlChange[] = [];

        // updating start/end picker date on period selected
        if (formState.controlsMarkedAsChanged.some((control) => control === 'period')) {
          const period = formState.value.period;
          if (!period) {
            changes.push({ controlName: 'start', operation: new Reset() });
            changes.push({ controlName: 'end', operation: new Reset() });
          } else {
            changes.push({
              controlName: 'start',
              operation: new SetValue(
                period === '' ? '' : new Date().toISOString()
              )
            });
            changes.push({
              controlName: 'end',
              operation: new SetValue(
                period === '7_days' ? new Date(Date.now() + 86400000 * 7).toISOString() :
                  period === '14_days' ? new Date(Date.now() + 86400000 * 14).toISOString() : ''
              )
            });
          }
        }

        // updating period on picker changed
        if (formState.controlsMarkedAsChanged.some((control) => control === 'start' || control === 'end') &&
          !!formState.value?.start &&
          !!formState.value?.end
        ) {
          changes.push({
            controlName: 'period',
            operation: new SetValue('custom') // TODO compute period from dates
          });
        }

        return changes;
      })
    };
  }),
  withMethods((store, httpClient = inject(HttpClient)) => ({
    handleFlightsSearchForm() {
      httpClient.get<Flight[]>(
        'https://demo.angulararchitects.io/api/flight',
            {
              params: new HttpParams()
                .set('from', store.flightsSearchFormState().value?.from)
                .set('to', store.flightsSearchFormState().value?.to)
                .set('start', store.flightsSearchFormState().value?.start)
                .set('end', store.flightsSearchFormState().value?.end),
            }
          ).subscribe(flights => patchState(store, { flights: flights }))
    }
  })),
);
