import { Component } from '@angular/core';
import { ReefMapComponent } from "../../reef-map/reef-map.component";

@Component({
  selector: 'app-test-map',
  standalone: true,
  imports: [ReefMapComponent],
  templateUrl: './test-map.component.html',
  styleUrl: './test-map.component.scss'
})
export class TestMapComponent {

}
