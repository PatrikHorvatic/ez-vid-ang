import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, output, signal, WritableSignal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaChapterMarker } from '../../types';
import { EvaActiveChaptedAria, EvaActiveChaptedAriaTransformed, transformEvaActiveChaptedAria } from '../../utils/aria-utilities';

@Component({
  selector: 'eva-active-chapter',
  templateUrl: './active-chapter.component.html',
  styleUrl: './active-chapter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "evaAria().ariaLabel",
    "(click)": "activeChapterClicked()",
    "(keydown)": "activeChapterClickedKeyboard($event)"
  }
})
export class EvaActiveChapterComponent implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

  readonly evaAria = input<EvaActiveChaptedAriaTransformed, EvaActiveChaptedAria>(transformEvaActiveChaptedAria(undefined), { transform: transformEvaActiveChaptedAria });
  readonly evaCustomIcon = input<boolean>(false);

  readonly evaChapterClicked = output<EvaChapterMarker | null>();

  protected activeChapter: WritableSignal<EvaChapterMarker | null> = signal(null);
  private chapterSub: Subscription | null = null;
  private timingSub: Subscription | null = null;

  ngOnInit(): void {
    this.evaAPI.isActiveChapterPresent = true;
    this.chapterSub = this.evaAPI.activeChapterSubject.subscribe(a => {
      this.activeChapter.set(a);
    });
  }

  ngOnDestroy(): void {
    this.evaAPI.isActiveChapterPresent = false;
    this.chapterSub?.unsubscribe();
    this.timingSub?.unsubscribe();
  }

  protected activeChapterClicked() {
    this.evaChapterClicked.emit(this.activeChapter());
  }

  /**
  * Handles keyboard events on the host element.
  * Triggers fullscreen toggle on `Enter`(13) or`Space`(32) keypress.
   */
  protected activeChapterClickedKeyboard(k: KeyboardEvent) {
    // On press Enter (13) or Space (32)
    if (k.keyCode === 13 || k.keyCode === 32) {
      k.preventDefault();
      this.activeChapterClicked();
    }
  }

}
