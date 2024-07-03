import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatButtonModule } from '@angular/material/button';
import { defineCustomElements } from "@arcgis/map-components/dist/loader";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'adria-app';

  ngOnInit(): void {
    // should only be called once
    // https://developers.arcgis.com/javascript/latest/get-started-angular/
    // works, but maybe better to put in provider/module
    defineCustomElements(window, { resourcesUrl: "https://js.arcgis.com/map-components/4.30/assets" });
  }

}
