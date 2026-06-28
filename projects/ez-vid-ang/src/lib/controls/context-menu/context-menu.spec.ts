import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaContextMenu } from './context-menu';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaContextMenu', () => {
  let component: EvaContextMenu;
  let fixture: ComponentFixture<EvaContextMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaContextMenu],
      providers: [EvaApi, EvaFullscreenAPI]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaContextMenu);
    fixture.componentRef.setInput('evaMenuItems', [
      { id: 'test', label: 'Test Item' }
    ]);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
