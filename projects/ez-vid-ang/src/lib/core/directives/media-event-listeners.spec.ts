import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { EvaPlayer } from '../player/player';

@Component({
  selector: 'eva-test-host',
  imports: [EvaPlayer],
  template: `<eva-player id="test" [evaVideoSources]="sources()" />`,
})
class TestHostComponent {
  protected readonly sources = signal([{ src: '', type: 'video/mp4' }]);
}

describe('MediaEventListenersDirective', () => {
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
