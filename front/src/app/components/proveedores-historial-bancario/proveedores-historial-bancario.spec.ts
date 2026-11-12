import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ProveedoresHistorialBancarioComponent } from './proveedores-historial-bancario';
import { SupplierHistoryService } from '../../services/supplier-history.service';

describe('ProveedoresHistorialBancarioComponent', () => {
  let fixture: ComponentFixture<ProveedoresHistorialBancarioComponent>;
  let component: ProveedoresHistorialBancarioComponent;
  let svc: { searchSuppliers: any; getVersions: any; getVersionDetail: any };

  const supplier = { id: 7, supplierCode: 'P001', supplierName: 'ACME', rfc: 'RFC1', businessUnitCode: 'BU1', accountNumber: '******1234', bankCurrency: 'USD', bankName: 'BANK X', versionCount: 3 };
  const page = (content: any[]) => ({ content, totalElements: content.length, totalPages: 1, number: 0, size: 10, empty: !content.length, first: true, last: true, numberOfElements: content.length });
  const version = { supplierId: 7, versionNumber: 1, createdAt: '2026-01-01T10:00:00', current: false, changedFields: ['routing_code_swift'] };
  const versionsRes = (content: any[]) => ({ current: { supplierId: 7, current: true }, versions: page(content) });
  const detail = {
    supplierId: 7, versionNumber: 1, createdAt: '2026-01-01T10:00:00', changedFields: ['routing_code_swift'],
    versionBank: { routingCodeSwift: 'OLDSWIFT', accountNumber: '******1234', bankCurrency: 'USD', bankCountry: 'US' },
    currentBank: { routingCodeSwift: 'NEWSWIFT', accountNumber: '******1234', bankCurrency: 'MXN', bankCountry: 'US' },
    diffs: [
      { field: 'routing_code_swift', differsFromCurrent: true, changedInVersion: true },
      { field: 'bank_currency', differsFromCurrent: true, changedInVersion: false },
      { field: 'account_number', differsFromCurrent: false, changedInVersion: false }
    ]
  };

  const el = () => fixture.nativeElement as HTMLElement;
  const render = async () => { fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); };
  const row = (f: string) => el().querySelector(`tr[data-field="${f}"]`)!;

  beforeEach(async () => {
    svc = {
      searchSuppliers: vi.fn().mockReturnValue(of(page([supplier]))),
      getVersions: vi.fn().mockReturnValue(of(versionsRes([version]))),
      getVersionDetail: vi.fn().mockReturnValue(of(detail))
    };
    await TestBed.configureTestingModule({
      imports: [ProveedoresHistorialBancarioComponent],
      providers: [provideTranslateService(), { provide: SupplierHistoryService, useValue: svc }]
    }).compileComponents();
    fixture = TestBed.createComponent(ProveedoresHistorialBancarioComponent);
    component = fixture.componentInstance;
    await render();
  });

  it('searches suppliers with filters and renders results with versionCount and masked account', async () => {
    component.supplierCodeFiltro = 'P001';
    component.supplierIdFiltro = '7';
    component.buscar();
    await render();
    expect(svc.searchSuppliers).toHaveBeenCalledWith(expect.objectContaining({ supplierCode: 'P001', supplierId: 7, page: 0, size: 10 }));
    expect(el().querySelectorAll('.supplier-row').length).toBe(1);
    expect(el().querySelector('.version-count')?.textContent?.trim()).toBe('3');
    expect(el().textContent).toContain('******1234');
  });

  it('shows error when supplier search fails', async () => {
    svc.searchSuppliers.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.buscar();
    await render();
    expect(el().querySelector('[data-testid="suppliers-error"]')).not.toBeNull();
  });

  it('selects supplier and lists versions with changed fields (snake_case mapped to labels)', async () => {
    component.buscar();
    component.selectSupplier(supplier);
    await render();
    expect(svc.getVersions).toHaveBeenCalledWith(7, 0, 10);
    expect(el().querySelectorAll('.version-row').length).toBe(1);
    expect(el().querySelector('.shb-chip')?.textContent).toContain('supplierHistory.fields.routingCodeSwift');
  });

  it('shows empty message when supplier has no versions', async () => {
    svc.getVersions.mockReturnValue(of(versionsRes([])));
    component.buscar();
    component.selectSupplier(supplier);
    await render();
    expect(el().querySelector('[data-testid="versions-empty"]')).not.toBeNull();
  });

  it('shows friendly not-found message on 404 for versions', async () => {
    svc.getVersions.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'x', status: 404 } })));
    component.selectSupplier(supplier);
    await render();
    expect(component.versionsNotFound).toBe(true);
    expect(el().querySelector('[data-testid="versions-error"]')?.textContent).toContain('supplierHistory.notFound');
  });

  it('renders comparison highlighting differsFromCurrent / changedInVersion with row highlights and values as received', async () => {
    component.selectSupplier(supplier);
    component.selectVersion(version);
    await render();
    expect(svc.getVersionDetail).toHaveBeenCalledWith(7, 1);
    expect(el().querySelectorAll('.compare-row').length).toBe(12);

    const swift = row('routingCodeSwift');
    expect(swift.classList.contains('shb-changed')).toBe(true);
    expect(swift.querySelector('.badge-diff')).toBeNull();
    expect(swift.querySelector('.badge-ver')).toBeNull();
    expect(swift.querySelector('.hist-value')?.textContent).toContain('OLDSWIFT');
    expect(swift.querySelector('.curr-value')?.textContent).toContain('NEWSWIFT');

    const cur = row('bankCurrency');
    expect(cur.classList.contains('shb-changed')).toBe(true);

    const acct = row('accountNumber');
    expect(acct.classList.contains('shb-changed')).toBe(false);
    expect(acct.querySelector('.hist-value')?.textContent?.trim()).toBe('******1234');
    expect(row('bankCountry').classList.contains('shb-changed')).toBe(false);
  });

  it('shows friendly message when detail returns 404 and generic on other errors', async () => {
    component.selectSupplier(supplier);
    svc.getVersionDetail.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.selectVersion(version);
    await render();
    expect(el().querySelector('[data-testid="detail-error"]')?.textContent).toContain('supplierHistory.notFound');

    svc.getVersionDetail.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.selectVersion(version);
    await render();
    expect(el().querySelector('[data-testid="detail-error"]')?.textContent).toContain('supplierHistory.errorDetail');
  });

  it('clear resets state', () => {
    component.buscar();
    component.selectSupplier(supplier);
    component.limpiar();
    expect(component.searched).toBe(false);
    expect(component.selectedSupplier).toBeNull();
    expect(component.display(null)).toBe('—');
  });
});
