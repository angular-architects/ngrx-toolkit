import { Component } from '@angular/core';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  template: `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Reactive Angular Applications</h2>
      </div>

      <div class="card-body">
        <ul>
          <li>Reactive Design</li>
          <li>State Management</li>
          <li>Signals</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    code {
      color: blue;
    }
  `]
})
export class HomeComponent {
}
