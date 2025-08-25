import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { initFlight } from './flight';

@Component({
  selector: 'demo-flight-card',
  imports: [RouterModule, DatePipe],
  templateUrl: './flight-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightCardComponent {
  readonly item = input(initFlight);
  selected = model.required<boolean>();

  select() {
    this.selected.set(true);
  }

  deselect() {
    this.selected.set(false);
  }
}
