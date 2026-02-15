import { AfterViewInit, Directive, ElementRef, inject, input, OnChanges, SimpleChanges } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaVideoElementConfiguration } from '../../types';
import { validateAndPrepareStartingVideoVolume } from '../../utils/utilities';

@Directive({
  selector: 'video[evaVideoConfiguration]',
  standalone: false
})
export class EvaVideoConfigurationDirective implements OnChanges, AfterViewInit {
  private evaAPI = inject(EvaApi);
  private elementRef = inject(ElementRef<HTMLVideoElement>);

  readonly evaVideoConfig = input.required<EvaVideoElementConfiguration>();

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
    if (!this.evaVideoConfig()) {
      return;
    }
    if (this.evaVideoConfig().width) {
      this.elementRef.nativeElement.width = this.evaVideoConfig().width!;
    }
    if (this.evaVideoConfig().height) {
      this.elementRef.nativeElement.height = this.evaVideoConfig().height!;
    }
    if (this.evaVideoConfig().autoplay) {
      this.elementRef.nativeElement.autoplay = this.evaVideoConfig().autoplay!;
    }
    if (this.evaVideoConfig().controls) {
      this.elementRef.nativeElement.controls = this.evaVideoConfig().controls!;
    }
    if (this.evaVideoConfig().crossorigin) {
      this.elementRef.nativeElement.crossOrigin = this.evaVideoConfig().crossorigin!;
    }
    if (this.evaVideoConfig().disablePictureInPicture) {
      this.elementRef.nativeElement.disablePictureInPicture = this.evaVideoConfig().disablePictureInPicture!;
    }
    if (this.evaVideoConfig().disableRemotePlayback) {
      this.elementRef.nativeElement.disableRemotePlayback = this.evaVideoConfig().disableRemotePlayback!;
    }
    if (this.evaVideoConfig().loop) {
      this.elementRef.nativeElement.loop = this.evaVideoConfig().loop!;
    }
    if (this.evaVideoConfig().muted) {
      this.elementRef.nativeElement.muted = this.evaVideoConfig().muted!;
    }
    if (this.evaVideoConfig().playinline) {
      this.elementRef.nativeElement.playsInline = this.evaVideoConfig().playinline!;
    }
    if (this.evaVideoConfig().poster) {
      this.elementRef.nativeElement.poster = this.evaVideoConfig().poster!;
    }
    if (this.evaVideoConfig().preload) {
      this.elementRef.nativeElement.preload = this.evaVideoConfig().preload!;
    }
    if (this.evaVideoConfig().startingVolume) {
      this.elementRef.nativeElement.volume = validateAndPrepareStartingVideoVolume(this.evaVideoConfig().startingVolume);
    }
  }

}
