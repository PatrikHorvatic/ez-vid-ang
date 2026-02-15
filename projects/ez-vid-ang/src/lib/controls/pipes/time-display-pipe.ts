import { Pipe, PipeTransform } from '@angular/core';
import { EvaTimeFormating } from '../../types';

@Pipe({
  name: 'evaTimeDisplay',
  pure: true,
  standalone: false
})
export class EvaTimeDisplayPipe implements PipeTransform {

  transform(value: number, formating: EvaTimeFormating): string {
    const totalSeconds = Math.max(0, Math.floor(value));

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    switch (formating) {
      case "HH:mm:ss":
        return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;

      case "mm:ss":
        // Include hours in total minutes if present
        const totalMinutes = hours * 60 + minutes;
        return `${this.pad(totalMinutes)}:${this.pad(seconds)}`;

      case "ss":
        return `${totalSeconds}`;

      default:
        return "00:00";
    }
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }

}
