import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
  svgOutput: SafeHtml = '';
  svgDownloadUrl: string = '';

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

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const svg = ImageTracer.imagedataToSVG(imageData, {
        pathomit: 8,
        numberofcolors: 8,
        colorquantcycles: 3,
        blurradius: 0,
      });

      this.svgOutput = this.sanitizer.bypassSecurityTrustHtml(svg);
      this.svgDownloadUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    };

    img.src = URL.createObjectURL(file);
  }
}
