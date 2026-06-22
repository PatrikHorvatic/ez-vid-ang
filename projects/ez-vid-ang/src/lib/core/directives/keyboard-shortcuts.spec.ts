import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { EvaKeyboardShortcuts } from './keyboard-shortcuts';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';
import { prepareDefaultKeyboardShortcutsConfiguration } from '../../utils/utilities';

@Component({
  template: `<video evaKeyboardShortcuts
    [evaKeyboardShortcutsEnabled]="enabled()"
    [evaKeyboardShortcutsConfiguration]="config()" />`,
  imports: [EvaKeyboardShortcuts],
  providers: [EvaApi, EvaFullscreenAPI],
})
class TestHostComponent {
  enabled = signal(false);
  config = signal(prepareDefaultKeyboardShortcutsConfiguration());
}

describe('EvaKeyboardShortcuts', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
  });

  it('should create the directive', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const videoEl = fixture.nativeElement.querySelector('video');
    expect(videoEl).toBeTruthy();
  });
});
