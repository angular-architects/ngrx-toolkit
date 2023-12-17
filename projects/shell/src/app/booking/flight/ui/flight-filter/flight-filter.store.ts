import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import { FlightService } from '../../logic/data-access/flight.service';
import { FlightFilter, initialFlightFilter } from '../../logic/model/flight-filter';


export type LocalState = {
  filters: FlightFilter[];
  inputFilter: FlightFilter;
  selectedFilter: FlightFilter;
};

export const initialLocalState: LocalState = {
  filters: [],
  inputFilter: initialFlightFilter,
  selectedFilter: initialFlightFilter,
};


export const FlightFilterStore = signalStore(
  // State
  withState<LocalState>(initialLocalState),
  // Selectors
  withComputed(({ filters }) => ({
    latestFilter: computed(
      () => filters().slice(-1)[0]
    ),
  })),
  // Updater
  withMethods((store) => ({
    updateInputFilter: (filter: FlightFilter) =>
      patchState(store, () => ({
        inputFilter: filter,
      })),
    updateSelectedFilter: (filter: FlightFilter) =>
      patchState(store, () => ({
        selectedFilter: filter,
      })),
    addFilter: (filter: FlightFilter) =>
      patchState(store, (state) => ({
        filters: [
          ...state.filters.filter(
            (f) => !(f.from === filter.from && f.to === filter.to)
          ),
          filter,
        ],
      })),
  })),
  // Effects
  withMethods(
    ({ inputFilter, addFilter, updateInputFilter, updateSelectedFilter }, flightService = inject(FlightService)) => ({
      triggerSearch: () => {
        addFilter(inputFilter());
      },
      initInputFilterUpdate: rxMethod<Partial<FlightFilter>>(
        pipe(tap((filter) => updateInputFilter(filter as FlightFilter)))
      ),
      initSelectedFilterUpdate: rxMethod<FlightFilter>(
        pipe(tap((filter) => updateSelectedFilter(filter)))
      ),
    })
  )
);
