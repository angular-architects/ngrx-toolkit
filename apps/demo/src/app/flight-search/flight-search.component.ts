import { Component, effect, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { Flight } from './flight';
import { FlightStore } from './flight-store';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'demo-flight-search',
  templateUrl: 'flight-search.component.html',
  imports: [
    MatTableModule,
    DatePipe,
    MatInputModule,
    FormsModule,
    MatButtonModule,
  ],
})
export class FlightSearchComponent {
  searchParams: { from: string; to: string } = { from: 'Paris', to: 'London' };
  flightStore = inject(FlightStore);

  displayedColumns: string[] = ['from', 'to', 'date'];
  dataSource = new MatTableDataSource<Flight>([]);
  selection = new SelectionModel<Flight>(true, []);

  constructor() {
    effect(() => {
      this.dataSource.data = this.flightStore.flights();
    });
  }

  search() {
    this.flightStore.loadFlights(this.searchParams);
  }
}
