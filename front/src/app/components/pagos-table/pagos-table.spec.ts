import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagosTable } from './pagos-table';

describe('PagosTable', () => {
  let component: PagosTable;
  let fixture: ComponentFixture<PagosTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagosTable],
    }).compileComponents();

    fixture = TestBed.createComponent(PagosTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
