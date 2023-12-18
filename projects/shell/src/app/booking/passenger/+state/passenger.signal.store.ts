import { createReduxState, mapAction, withActionMappers } from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, type, withMethods } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { createActionGroup, props } from '@ngrx/store';
import { Passenger } from './../logic/model/passenger';


export const PassengerStore = signalStore(
  { providedIn: 'root' },
  // State
  withEntities({ entity: type<Passenger>(), collection: 'passenger' }),
  // Updater
  withMethods(store => ({
    setPassengers: (state: { passengers: Passenger[] }) => patchState(store,
      setAllEntities(state.passengers, { collection: 'passenger' })),
  })),
);

export const passengerActions = createActionGroup({
  source: 'passenger',
  events: {
    'passengers loaded': props<{ passengers: Passenger[] }>()
  }
});

export const { providePassengerStore, injectPassengerStore } =
  createReduxState('passenger', PassengerStore, store => withActionMappers(
    mapAction(passengerActions.passengersLoaded, store.setPassengers)
  )
);
