import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { getEvaIcon } from './icon-registry';

/**
 * Internal rendering component for Eva icon registry lookups.
 *
 * Resolves the SVG string for the given `name` from the global registry
 * (populated via `addEvaIcons`) and injects it as trusted HTML.
 *
 * Both the host element and the inner span use `display: contents` so they
 * are fully layout-transparent — the SVG renders as if it is a direct child
 * of the parent component.
 *
 * @internal Not intended for direct use by library consumers.
 */
@Component({
  selector: 'eva-icon',
  template: `<span aria-hidden="true" style="display:contents" [innerHTML]="safeSvg()"></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display:contents'
  }
})
export class EvaIcon {
  private readonly sanitizer = inject(DomSanitizer);

  /** Registry key for the icon to render (e.g. `"play"`, `"cinema-mode"`). */
  public readonly name = input.required<string>();

  protected readonly safeSvg = computed<SafeHtml | null>(() => {
    const svg = getEvaIcon(this.name());
    return svg ? this.sanitizer.bypassSecurityTrustHtml(svg) : null;
  });
}
