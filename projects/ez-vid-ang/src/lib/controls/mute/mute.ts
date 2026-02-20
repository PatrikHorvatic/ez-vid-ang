import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { Subscription } from 'rxjs';
import { EvaMuteAria } from '../../utils/aria-utilities';

@Component({
  selector: 'eva-mute',
  templateUrl: './mute.html',
  styleUrl: './mute.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "muteAriaLabel()",
    "[attr.aria-valuetext]": "muteAriaValueText()",
    "[class.eva-icon]": "!evaCustomIcon()",
    "[class.eva-icon-volume_up]": "!evaCustomIcon() && evaIconVolumeUp()",
    "[class.eva-icon-volume_middle]": "!evaCustomIcon() && evaIconVolumeMiddle()",
    "[class.eva-icon-volume_low]": "!evaCustomIcon() && evaIconVolumeLow()",
    "[class.eva-icon-volume_off]": "!evaCustomIcon() && evaIconVolumeOff()",
    "(click)": "muteClicked()",
    "(keydown)": "muteClickKeyboard($event)"
  }
})
export class EvaMute implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

  readonly evaAria = input<EvaMuteAria>();
  readonly evaCustomIcon = input<boolean>(false);

  readonly evaLowVolume = input<number, number>(0.25, { transform: this.validateAndTransformVolumeRange });
  readonly evaMiddleVolume = input<number, number>(0.75, { transform: this.validateAndTransformVolumeRange });

  protected muteAriaLabel = computed<string>(() => {
    if (!this.evaAria()) {
      return "mute";
    }
    return this.evaAria()!.ariaLabel ? this.evaAria()!.ariaLabel! : 'mute';
  });

  protected muteAriaValueText = computed<string>(() => {
    if (this.evaAria()) {
      if (!this.videoVolume) {
        return this.evaAria()!.ariaValueTextUnmuted ? this.evaAria()!.ariaValueTextUnmuted! : "unmuted";
      }
      return this.videoVolume() > 0
        ? this.evaAria()!.ariaValueTextUnmuted ? this.evaAria()!.ariaValueTextUnmuted! : "unmuted"
        : this.evaAria()!.ariaValueTextMuted ? this.evaAria()!.ariaValueTextMuted! : "muted";
    }
    else {
      if (!this.videoVolume) {
        return this.evaAria()?.ariaValueTextUnmuted ? this.evaAria()!.ariaValueTextUnmuted! : "unmuted";
      }
      return this.videoVolume() > 0 ? "unmuted" : "muted";
    }
  });

  protected evaIconVolumeUp = computed<boolean>(() => {
    return this.videoVolume() >= this.evaMiddleVolume();
  });
  protected evaIconVolumeMiddle = computed<boolean>(() => {
    return this.videoVolume() >= this.evaLowVolume() && this.videoVolume() < this.evaMiddleVolume();
  });
  protected evaIconVolumeLow = computed<boolean>(() => {
    return this.videoVolume() > 0 && this.videoVolume() < this.evaLowVolume();
  });
  protected evaIconVolumeOff = computed<boolean>(() => {
    return !this.videoVolume();
  });


  protected videoVolume!: WritableSignal<number>;
  private videoVolumeSub: Subscription | null = null;

  ngOnInit(): void {
    this.videoVolume = signal(this.evaAPI.getVideoVolume());
    this.videoVolumeSub = this.evaAPI.videoVolumeSubject.subscribe(volume => {
      if (volume !== null) {
        this.videoVolume.set(volume);
      }
    })
  }

  ngOnDestroy(): void {
    this.videoVolumeSub?.unsubscribe();
  }

  protected muteClicked() {
    this.evaAPI.muteOrUnmuteVideo()
  }

  protected muteClickKeyboard(k: KeyboardEvent) {
    // On press Enter (13) or Space (32)
    if (k.keyCode === 13 || k.keyCode === 32) {
      k.preventDefault();
      this.muteClicked();
    }
  }

  private validateAndTransformVolumeRange(v: number): number {
    {
      if (!v) {
        return 0;
      }
      if (v < 0) {
        return 0;
      }
      if (v > 1) {
        return 1;
      }
      return v;
    }
  }
}
