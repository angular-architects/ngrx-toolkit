import { Component, inject, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { FlightStore } from './flight-store';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatOption, provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'demo-flight-form-search',
  templateUrl: 'flight-form-search.component.html',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    MatTableModule,
    DatePipe,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatSelect,
    MatOption
  ]
})
export class FlightFormSearchComponent implements OnInit {
  formBuilder = inject(FormBuilder);
  flightSearchForm = this.formBuilder.group({
    to: '',
    from: '',
    start: '',
    end: '',
    period: ''
  });

  flightStore = inject(FlightStore);
  displayedColumns: string[] = ['from', 'to', 'date'];

  ngOnInit(): void {
    this.flightStore.setFlightsSearchFormGroup(this.flightSearchForm, this.flightStore);
  }
}
