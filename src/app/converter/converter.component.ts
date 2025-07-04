import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as potrace from 'potrace';


declare const ImageTracer: any;

@Component({
  selector: 'app-converter',
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.scss'],
  imports: [CommonModule]
})
export class ConverterComponent {
  
  constructor(private sanitizer: DomSanitizer) {}
  
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  imageData!: ImageData;
  svgOutput: SafeHtml = '';
  svgDownloadUrl: string = '';
  activeButton: string = '';
  hideUpload: boolean = true;
  hideConvert: boolean = true;

  setActive(buttonName: string) {
    this.activeButton = buttonName;
    console.log("setActive");
  }

  displayUpload() {
    this.hideUpload = false;
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
    };

    img.src = URL.createObjectURL(file);
    this.hideConvert = false;
  }

  checkTraceMode() {
    console.log(this.activeButton, "is the active button")
    if (this.activeButton == 'colorBtn') {
      this.traceColor();
    }
    if (this.activeButton == 'bwBtn') {
      this.traceBW();
    }
    else {
      console.log("No mode found!");
    }
  }

  traceColor() {
    const svg = ImageTracer.imagedataToSVG(this.imageData, {
      pathomit: 8,
      numberofcolors: 8,
      colorquantcycles: 3,
      blurradius: 0,
    });

    this.setSvg(svg);
  }

  traceBW() {
    const canvas = this.canvasRef.nativeElement;
    canvas.toBlob(blob => {
      if (!blob) return;
      potrace.trace(URL.createObjectURL(blob), { threshold: 128 }, (err, svg) => {
        if (err) {
          console.error(err);
          return;
        }
        this.setSvg(svg);
      });
    });
  }

  private setSvg(raw: string) {
    this.svgOutput = this.sanitizer.bypassSecurityTrustHtml(raw);
    this.svgDownloadUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(raw);
  }
}
