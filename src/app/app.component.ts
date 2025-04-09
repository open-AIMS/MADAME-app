import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { defineCustomElements as defineArcgisMapElements } from '@arcgis/map-components/dist/loader';
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

    // should only be called once
    // https://developers.arcgis.com/javascript/latest/get-started-angular/
    // works, but maybe better to put in provider/module
    defineArcgisMapElements(window, {
      resourcesUrl: 'https://js.arcgis.com/map-components/4.30/assets',
    });
  }
}
