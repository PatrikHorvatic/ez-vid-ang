import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaTimeFormating, EvaTimeProperty } from '../../types';
import { EvaTimeDisplayAria } from '../../utils/aria-utilities';

@Component({
  selector: 'eva-time-display',
  templateUrl: './time-display.html',
  styleUrl: './time-display.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "timer",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-live]": "'off'", // Change to 'polite' for live updates announcements
    "[attr.aria-atomic]": "'true'",
    "[attr.aria-valuetext]": "displayText()",
  }
})
export class EvaTimeDisplay {
  protected evaAPI = inject(EvaApi);

  readonly evaTimeProperty = input.required<EvaTimeProperty>();
  readonly evaTimeFormating = input.required<EvaTimeFormating>();
  readonly evaLiveText = input<string>("LIVE");

  readonly evaAria = input<EvaTimeDisplayAria>({});


  // Computed aria-label
  protected ariaLabel = computed(() => {
    const property = this.evaTimeProperty();
    if (property === "current") {
      return this.evaAria().ariaLabelCurrent ? this.evaAria().ariaLabelCurrent : "Current time display"
    }
    else if (property === "total") {
      return this.evaAria().ariaLabelTotal ? this.evaAria().ariaLabelTotal : "Duration display"
    }
    else {
      return this.evaAria().ariaLabelRemaining ? this.evaAria().ariaLabelRemaining : "Remaining time display"
    }
  });

  // Computed display text (same logic as template)
  protected displayText = computed(() => {
    if (this.evaAPI.isLive()) {
      return this.evaLiveText();
    }

    // You'll need to implement the formatting logic here
    // or import a utility function from your pipe
    const timeValue = this.evaAPI.time()[this.evaTimeProperty()];
    return this.formatTime(timeValue, this.evaTimeFormating());
  });

  // Helper method to format time (extract this from your pipe)
  private formatTime(seconds: number, format: EvaTimeFormating): string {
    // Implement your time formatting logic here
    // This should match what your EvaTimeDisplayPipe does
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    switch (format) {
      case 'HH:mm:ss':
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      case 'mm:ss':
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      // Add other formats as needed
      default:
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
}