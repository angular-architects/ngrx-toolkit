import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PassengerService } from '../../logic/data-access/passenger.service';
import { Passenger, initialPassenger } from '../../logic/model/passenger';
import { injectPassengerStore, passengerActions } from '../../+state/passenger.signal.store';


@Component({
  selector: 'app-passenger-search',
  standalone: true,
  imports: [
    NgFor, NgIf,
    RouterLink,
    FormsModule
  ],
  templateUrl: './passenger-search.component.html'
})
export class PassengerSearchComponent {
  private store = injectPassengerStore();

  firstname = '';
  lastname = 'Smith';
  selectedPassenger?: Passenger;
  #passengerService = inject(PassengerService)

  get passengers() {
    return this.#passengerService.passengers;
  }

  constructor() {
    this.store.dispatch(
      passengerActions.passengersLoaded({
        passengers: [initialPassenger]
      })
    );
  }

  search(): void {
    if (!(this.firstname || this.lastname)) return;

    this.#passengerService.load(this.firstname, this.lastname);
  }

  select(passenger: Passenger): void {
    this.selectedPassenger = this.selectedPassenger === passenger ? undefined : passenger;
  }
}
