import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";
import { RouterModule } from "@angular/router";
import { initFlight } from "./flight";

@Component({
  standalone: true,
  selector: 'demo-flight-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './flight-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightCardComponent {
  @Input() item = initFlight;
  @Input() selected: boolean | undefined;
  @Output() selectedChange = new EventEmitter<boolean>();

  select() {
    this.selected = true;
    this.selectedChange.next(true);
  }

  deselect() {
    this.selected = false;
    this.selectedChange.next(false);
  }

}
