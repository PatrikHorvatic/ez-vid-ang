import { AfterViewInit, Directive, ElementRef, inject, input, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EvaVideoElementConfiguration } from '../../types';
import { EvaApi } from '../../api/eva-api';

@Directive({
  selector: 'video[evaVideoConfiguration]',
  standalone: false
})
export class EvaVideoConfigurationDirective implements OnChanges, AfterViewInit {
  private evaAPI = inject(EvaApi);
  private elementRef = inject(ElementRef<HTMLVideoElement>);

  readonly videoConfig = input.required<EvaVideoElementConfiguration>();

  private isViewInitialized = false;

  ngOnChanges(changes: SimpleChanges): void {
    // Only apply changes if view is initialized and videoConfig changed
    if (this.isViewInitialized && changes['videoConfig']) {
      this.applyConfiguration();
    }
  }


  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    this.applyConfiguration();
  }

  private applyConfiguration(): void {
    if (!this.videoConfig()) {
      return;
    }
    if (this.videoConfig().width) {
      this.elementRef.nativeElement.width = this.videoConfig().width!;
    }
    if (this.videoConfig().height) {
      this.elementRef.nativeElement.height = this.videoConfig().height!;
    }
    if (this.videoConfig().autoplay) {
      this.elementRef.nativeElement.autoplay = this.videoConfig().autoplay!;
    }
    if (this.videoConfig().controls) {
      this.elementRef.nativeElement.controls = this.videoConfig().controls!;
    }
    if (this.videoConfig().crossorigin) {
      this.elementRef.nativeElement.crossOrigin = this.videoConfig().crossorigin!;
    }
    if (this.videoConfig().disablePictureInPicture) {
      this.elementRef.nativeElement.disablePictureInPicture = this.videoConfig().disablePictureInPicture!;
    }
    if (this.videoConfig().disableRemotePlayback) {
      this.elementRef.nativeElement.disableRemotePlayback = this.videoConfig().disableRemotePlayback!;
    }
    if (this.videoConfig().loop) {
      this.elementRef.nativeElement.loop = this.videoConfig().loop!;
    }
    if (this.videoConfig().muted) {
      this.elementRef.nativeElement.muted = this.videoConfig().muted!;
    }
    if (this.videoConfig().playinline) {
      this.elementRef.nativeElement.playsInline = this.videoConfig().playinline!;
    }
    if (this.videoConfig().poster) {
      this.elementRef.nativeElement.poster = this.videoConfig().poster!;
    }
    if (this.videoConfig().preload) {
      this.elementRef.nativeElement.preload = this.videoConfig().preload!;
    }
  }

}
