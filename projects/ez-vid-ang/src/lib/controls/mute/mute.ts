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
    "[class.eva-icon]": "true",
    "[class.eva-icon-volume_up]": "videoVolume() >= 0.75",
    "[class.eva-icon-volume_down]": "videoVolume() >= 0.25 && videoVolume() < 0.75",
    "[class.eva-icon-volume_mute]": "videoVolume() > 0 && videoVolume() < 0.25",
    // covers null and 0
    "[class.eva-icon-volume_off]": "!videoVolume()",
    "(click)": "muteClicked()",
    "(keydown)": "muteClickKeyboard($event)"
  }
})
export class EvaMute implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);
  readonly evaAria = input<EvaMuteAria>();


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

}
