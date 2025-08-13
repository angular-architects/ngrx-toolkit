import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
  model,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { initFlight } from './flight';

@Component({
  selector: 'demo-flight-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './flight-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightCardComponent {
  readonly item = input(initFlight);
  selected = model.required<boolean>();
  @Output() selectedChange = new EventEmitter<boolean>();

  select() {
    this.selected.set(true);
    this.selectedChange.next(true);
  }

  deselect() {
    this.selected.set(false);
    this.selectedChange.next(false);
  }
}
