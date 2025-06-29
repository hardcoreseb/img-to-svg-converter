import { Component } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
import { ConverterComponent } from './converter/converter.component';
import { HeadlineComponent } from "./headline/headline.component";

@Component({
  selector: 'app-root',
  imports: [
    // RouterOutlet,
    ConverterComponent,
    HeadlineComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'img-to-svg-converter';
}
