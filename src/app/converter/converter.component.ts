import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as potrace from 'potrace';
import { NgZone } from '@angular/core';


declare const ImageTracer: any;

@Component({
  selector: 'app-converter',
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.scss'],
  imports: [CommonModule]
})
export class ConverterComponent {
  
  constructor(private sanitizer: DomSanitizer, private ngZone: NgZone) {}
  
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('posterizedCheckbox', { static: false }) posterizedCheckboxRef!: ElementRef<HTMLInputElement>;
  @ViewChild('colorTraceButton', { static: false }) colorTraceButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('bwTraceButton', { static: false }) bwTraceButton!: ElementRef<HTMLButtonElement>;

  imageData!: ImageData;
  svgOutput: SafeHtml = '';
  svgDownloadUrl: string = '';
  activeButton: string = '';
  showUpload: boolean = false;
  showConvert: boolean = false;
  checkBoxChecked: boolean = false;
  checkBoxDisabled: boolean = true;

  setActive(buttonName: string) {
    if (buttonName === this.activeButton) {
      this.activeButton = '';
      this.checkBoxDisabled = true;
      this.checkBoxChecked = false;

      //Force uncheck in the DOM
      if (this.posterizedCheckboxRef?.nativeElement) {
      this.posterizedCheckboxRef.nativeElement.checked = false;
      }
      return;
    }

    this.activeButton = buttonName;
    this.displayUpload();

    if (buttonName === 'bwBtn') {
      this.checkBoxDisabled = false;
    } 
    else {
      this.checkBoxDisabled = true;
      this.checkBoxChecked = false;

      //Force uncheck in the DOM
      if (this.posterizedCheckboxRef?.nativeElement) {
      this.posterizedCheckboxRef.nativeElement.checked = false;
    }
    }
  }

  displayUpload() {
    this.showUpload = true;
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    const img = new Image();
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      this.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      this.showConvert = true;
    };

    img.src = URL.createObjectURL(file);
  }

  checkTraceMode() {
    if (this.activeButton == 'colorBtn') {
      this.traceColor();
      return;
    }
    else if (this.activeButton == 'bwBtn') {
      if(this.checkBoxChecked) {
        this.posterize();
        return;
      }
      this.traceBW();
      return;
    }
    else {
      console.error("No mode found!");
      return;
    }
  }

  traceColor() {
    const svg = ImageTracer.imagedataToSVG(this.imageData, {
      pathomit: 16, //Edge node paths shorter than this will be discarded for noise reduction.
      numberofcolors: 8, //Number of colors to use on palette if pal object is not defined.
      colorquantcycles: 3, //Color quantization will be repeated this many times.
      blurradius: 0, //Set this to 1..5 for selective Gaussian blur preprocessing.
    });

    this.setSvg(svg);
  }

  traceBW() {
    const canvas = this.canvasRef.nativeElement;
    canvas.toBlob(blob => {
      if (!blob) return;
      potrace.trace(URL.createObjectURL(blob), { }, (err, svg) => {
        if (err) {
          console.error(err);
          return;
        }
        // Trigger UI to update
        this.ngZone.run(() => {
          this.setSvg(svg);
        });
      });
    });
  }

  posterize() {
    const canvas = this.canvasRef.nativeElement;
    canvas.toBlob(blob => {
      if (!blob) return;
      potrace.posterize(URL.createObjectURL(blob), { }, (err, svg) => {
        if (err) {
          console.error(err);
          return;
        }
        // Trigger UI to update
        this.ngZone.run(() => {
          this.setSvg(svg);
        });
      });
    });
  }

  private setSvg(raw: string) {

    var displaySvg = raw;

    // Try to extract the width and height values
    const widthMatch = displaySvg.match(/width="(\d+)"/);
    const heightMatch = displaySvg.match(/height="(\d+)"/);

    if (widthMatch && heightMatch) {
    const width = widthMatch[1];
    const height = heightMatch[1];

    // Add viewBox and override width/height for scaling
    displaySvg = displaySvg
      .replace(/<svg([^>]*)>/, `<svg$1 viewBox="0 0 ${width} ${height}" width="100%" height="auto">`)
      .replace(/width="[^"]+"/, 'width="100%"')
      .replace(/height="[^"]+"/, 'height="auto"');
    }

    this.svgOutput = this.sanitizer.bypassSecurityTrustHtml(displaySvg);
    this.svgDownloadUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(raw);
  }
}
