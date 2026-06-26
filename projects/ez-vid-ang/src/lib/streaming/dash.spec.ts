import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { EvaPlayer } from '../core/player/player';
import { EvaDashDirective } from './dash';

@Component({
  selector: 'eva-test-host',
  imports: [EvaPlayer, EvaDashDirective],
  template: `<eva-player evaDash id="test"  evaDashSrc=""  [evaVideoSources]="sources()"/>`,
})
class TestHostComponent {
  public readonly sources = signal([{ src: '', type: 'video/mp4' }]);
}

describe('DashDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
