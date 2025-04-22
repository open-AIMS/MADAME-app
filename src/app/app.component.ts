import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { defineCustomElements as defineCalciteElements } from '@esri/calcite-components/dist/loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'adria-app';

  ngOnInit(): void {
    defineCalciteElements(window, {
      resourcesUrl: 'https://js.arcgis.com/calcite-components/2.11.1/assets',
    });
  }
}
