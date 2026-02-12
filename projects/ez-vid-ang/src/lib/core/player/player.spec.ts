import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaPlayer } from './player';

describe('Player', () => {
  let component: EvaPlayer;
  let fixture: ComponentFixture<EvaPlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaPlayer]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaPlayer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
