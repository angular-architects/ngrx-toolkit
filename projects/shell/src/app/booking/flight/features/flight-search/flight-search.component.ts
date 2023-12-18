import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import { ticketActions } from '../../+state/actions';
import { injectTicketStore } from '../../+state/ngrx-signals/tickets.signal.store';
import { Flight } from '../../logic/model/flight';
import { FlightFilter } from '../../logic/model/flight-filter';
import { FlightCardComponent } from '../../ui/flight-card/flight-card.component';
import { FlightFilterComponent } from '../../ui/flight-filter/flight-filter.component';


@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FlightCardComponent,
    FlightFilterComponent
  ],
  selector: 'app-flight-search',
  templateUrl: './flight-search.component.html',
})
export class FlightSearchComponent {
  private store = injectTicketStore();

  protected localState = signalState({
    filter: {
      from: 'Hamburg',
      to: 'Graz',
      urgent: false
    },
    basket: {
      3: true,
      5: true
    } as Record<number, boolean>,
    flights: [] as Flight[]
  });

  constructor() {
    this.connectInitialLogic();
  }

  private connectInitialLogic(): void {
    // Conntect local and global State Management
    rxMethod<Flight[]>(pipe(
      tap(flights => patchState(this.localState, { flights }))
    ))(this.store.flightEntities);
  }

  protected search(filter: FlightFilter): void {
    patchState(this.localState, { filter });

    if (!this.localState.filter.from() || !this.localState.filter.to()) {
      return;
    }

    this.store.dispatch(
      ticketActions.flightsLoad(this.localState.filter())
    );
  }

  protected updateBasket(id: number, selected: boolean): void {
    patchState(this.localState, state => ({
      basket: {
        ...state.basket,
        [id]: selected
      }
    }));
  }

  protected delay(flight: Flight): void {
    const oldFlight = flight;
    const oldDate = new Date(oldFlight.date);

    const newDate = new Date(oldDate.getTime() + 1000 * 60 * 5); // Add 5 min
    const newFlight = {
      ...oldFlight,
      date: newDate.toISOString(),
      delayed: true
    };

    this.store.dispatch(ticketActions.flightUpdate({ flight: newFlight }));
  }

  protected reset(): void {
    this.store.dispatch(ticketActions.flightsClear());
  }
}
