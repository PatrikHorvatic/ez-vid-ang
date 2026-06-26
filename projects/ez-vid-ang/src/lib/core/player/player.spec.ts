import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { EvaPlayer } from './player';

@Component({
  selector: 'eva-test-host',
  imports: [EvaPlayer],
  template: `<eva-player id="test" [evaVideoSources]="sources()" />`,
})
class TestHostComponent {
  public readonly sources = signal([{ src: '', type: 'video/mp4' }]);
}

describe('Player', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
