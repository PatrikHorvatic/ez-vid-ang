import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { EvaPlayer } from '../core/player/player';
import { EvaHlsDirective } from './hls';

@Component({
  selector: 'eva-test-host',
  imports: [EvaPlayer, EvaHlsDirective],
  template: `<eva-player evaHls id="test" evaHlsSrc="" [evaVideoSources]="sources()" />`,
})
class TestHostComponent {
  protected readonly sources = signal([{ src: '', type: 'video/mp4' }]);
}

describe('HlsDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should create an instance', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
