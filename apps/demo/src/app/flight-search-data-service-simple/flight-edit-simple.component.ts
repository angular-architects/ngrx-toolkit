import { Component, OnInit, inject, input, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { Flight } from '../shared/flight';
import { SimpleFlightBookingStore } from './flight-booking-simple.store';

@Component({
  imports: [
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  selector: 'demo-flight-edit-simple',
  templateUrl: './flight-edit-simple.component.html',
  styles: `
    #fields {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    #buttons {
      display: flex;
      gap: 5px;
    }
  `,
})
export class FlightEditSimpleComponent implements OnInit {
  private store = inject(SimpleFlightBookingStore);

  private readonly form = viewChild.required(NgForm);

  current = this.store.current;
  loading = this.store.loading;
  error = this.store.error;

  readonly id = input.required<string>();

  ngOnInit(): void {
    this.store.loadById(this.id());
  }

  async save() {
    const flight = this.form().value as Flight;
    if (flight.id) {
      await this.store.update(flight);
    } else {
      await this.store.create(flight);
    }
  }

  async createNew() {
    await this.store.setCurrent({} as Flight);
  }

  async deleteFlight() {
    await this.store.delete(this.form().value);
  }
}
