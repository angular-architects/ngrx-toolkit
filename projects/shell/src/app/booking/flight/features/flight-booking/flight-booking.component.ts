import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-flight-booking',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink
  ],
  template: `
    <div class="card">
      <div class="card-body nav">
        <a routerLink="./search" class="mr5">Flight Search</a> |
        <a routerLink="./typeahead" class="ml5">Flight Typeahead</a>
      </div>
    </div>

    <div>
      <router-outlet></router-outlet>
    </div>
  `
})
export class FlightBookingComponent {
}
