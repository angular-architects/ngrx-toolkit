import { Component, effect, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { FlightBookingStore } from './flight-store';
import { Flight } from '../shared/flight';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'demo-flight-search-with-pagination',
  templateUrl: 'flight-search-with-pagination.component.html',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    DatePipe,
    MatInputModule,
    FormsModule,
    MatButtonModule,
  ],
  providers: [FlightBookingStore],
})
export class FlightSearchWithPaginationComponent {
  searchParams: { from: string; to: string } = { from: 'Wien', to: '' };
  flightStore = inject(FlightBookingStore);

  displayedColumns: string[] = ['from', 'to', 'date'];
  dataSource = new MatTableDataSource<Flight>([]);
  selection = new SelectionModel<Flight>(true, []);

  constructor() {
    effect(() => {
      this.dataSource.data = this.flightStore.selectedPageFlightEntities();
    });
    this.flightStore.loadFlightEntities();
  }

  search() {
    this.flightStore.updateFlightFilter(this.searchParams);
    this.flightStore.loadFlightEntities();
  }

  handlePageEvent(e: PageEvent) {
    this.flightStore.setFlightPageSize(e.pageSize);
    this.flightStore.gotoFlightPage(e.pageIndex);
  }
}
