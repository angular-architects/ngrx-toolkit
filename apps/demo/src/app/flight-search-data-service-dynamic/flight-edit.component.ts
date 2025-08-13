import { Component, OnInit, inject, input, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Flight } from '../shared/flight';
import { FlightBookingStore } from './flight-booking.store';

@Component({
  imports: [RouterModule, FormsModule],
  selector: 'demo-flight-edit',
  templateUrl: './flight-edit.component.html',
})
export class FlightEditDynamicComponent implements OnInit {
  private readonly form = viewChild.required(NgForm);

  private store = inject(FlightBookingStore);

  current = this.store.currentFlight;
  loading = this.store.flightLoading;
  error = this.store.flightError;

  readonly id = input.required<string>();

  ngOnInit(): void {
    this.store.loadFlightById(this.id());
  }

  async save() {
    const flight = this.form().value as Flight;
    if (flight.id) {
      await this.store.updateFlight(flight);
    } else {
      await this.store.createFlight(flight);
    }
  }

  async createNew() {
    await this.store.setCurrentFlight({} as Flight);
  }

  async deleteFlight() {
    await this.store.deleteFlight(this.form().value);
  }
}
