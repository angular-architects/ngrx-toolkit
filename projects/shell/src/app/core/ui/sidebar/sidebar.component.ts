import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLinkActive, RouterLinkWithHref } from '@angular/router';
import { FlightService } from '../../../booking/flight/logic/data-access/flight.service';
import { injectTicketStore } from '../../../booking/flight/+state/ngrx-signals/tickets.signal.store';


@Component({
  selector: 'app-sidebar-cmp',
  standalone: true,
  templateUrl: 'sidebar.component.html',
  imports: [
    NgFor, NgIf, AsyncPipe,
    RouterLinkWithHref, RouterLinkActive
  ]
})
export class SidebarComponent {
  protected flightCount = injectTicketStore().flightCount;
}
