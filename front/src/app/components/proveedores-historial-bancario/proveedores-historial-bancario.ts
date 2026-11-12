import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent, PageContentComponent } from 'rassini-ui';
import {
  SupplierHistoryService,
  SupplierSummaryDto,
  SupplierVersionSummaryDto,
  SupplierVersionDetailDto,
  BANK_FIELDS,
  SENSITIVE_FIELDS,
  toCamel
} from '../../services/supplier-history.service';

export interface ComparisonRow {
  field: string;
  versionValue: string | null;
  currentValue: string | null;
  differsFromCurrent: boolean;
  changedInVersion: boolean;
  sensitive: boolean;
}

@Component({
  selector: 'app-proveedores-historial-bancario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TranslatePipe,
    DatePipe,
    PageHeaderComponent,
    PageContentComponent
  ],
  templateUrl: './proveedores-historial-bancario.html',
  styleUrl: './proveedores-historial-bancario.scss'
})
export class ProveedoresHistorialBancarioComponent {
  private readonly service = inject(SupplierHistoryService);
  private readonly cdr = inject(ChangeDetectorRef);

  // search filters
  supplierIdFiltro = '';
  supplierCodeFiltro = '';
  supplierNameFiltro = '';
  taxIdFiltro = '';

  // suppliers
  suppliers: SupplierSummaryDto[] = [];
  suppliersTotal = 0;
  suppliersPage = 0;
  suppliersSize = 10;
  loadingSuppliers = false;
  suppliersError = false;
  searched = false;

  // versions
  selectedSupplier: SupplierSummaryDto | null = null;
  versions: SupplierVersionSummaryDto[] = [];
  versionsTotal = 0;
  versionsPage = 0;
  versionsSize = 10;
  loadingVersions = false;
  versionsError = false;
  versionsNotFound = false;

  // detail
  selectedVersion: SupplierVersionSummaryDto | null = null;
  detail: SupplierVersionDetailDto | null = null;
  rows: ComparisonRow[] = [];
  loadingDetail = false;
  detailError = false;
  detailNotFound = false;

  buscar(): void {
    this.suppliersPage = 0;
    this.clearSelection();
    this.loadSuppliers();
  }

  limpiar(): void {
    this.supplierIdFiltro = '';
    this.supplierCodeFiltro = '';
    this.supplierNameFiltro = '';
    this.taxIdFiltro = '';
    this.suppliers = [];
    this.suppliersTotal = 0;
    this.searched = false;
    this.suppliersError = false;
    this.clearSelection();
  }

  onSuppliersLazyLoad(event: TableLazyLoadEvent): void {
    if (!this.searched) return;
    const size = event.rows ?? this.suppliersSize;
    this.suppliersSize = size;
    this.suppliersPage = Math.floor((event.first ?? 0) / size);
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    const id = this.supplierIdFiltro?.toString().trim();
    this.loadingSuppliers = true;
    this.suppliersError = false;
    this.searched = true;
    this.service
      .searchSuppliers({
        supplierId: id && /^\d+$/.test(id) ? Number(id) : null,
        supplierCode: this.supplierCodeFiltro,
        supplierName: this.supplierNameFiltro,
        taxId: this.taxIdFiltro,
        page: this.suppliersPage,
        size: this.suppliersSize
      })
      .subscribe({
        next: page => {
          this.suppliers = page?.content ?? [];
          this.suppliersTotal = page?.totalElements ?? 0;
          this.loadingSuppliers = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.suppliers = [];
          this.suppliersTotal = 0;
          this.suppliersError = true;
          this.loadingSuppliers = false;
          this.cdr.markForCheck();
        }
      });
  }

  selectSupplier(supplier: SupplierSummaryDto): void {
    this.selectedSupplier = supplier;
    this.versionsPage = 0;
    this.closeDetail();
    this.loadVersions();
  }

  onVersionsLazyLoad(event: TableLazyLoadEvent): void {
    if (!this.selectedSupplier) return;
    const size = event.rows ?? this.versionsSize;
    this.versionsSize = size;
    this.versionsPage = Math.floor((event.first ?? 0) / size);
    this.loadVersions();
  }

  loadVersions(): void {
    if (!this.selectedSupplier) return;
    this.loadingVersions = true;
    this.versionsError = false;
    this.versionsNotFound = false;
    this.service.getVersions(this.selectedSupplier.id, this.versionsPage, this.versionsSize).subscribe({
      next: res => {
        this.versions = res?.versions?.content ?? [];
        this.versionsTotal = res?.versions?.totalElements ?? 0;
        this.loadingVersions = false;
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.versions = [];
        this.versionsTotal = 0;
        this.versionsError = true;
        this.versionsNotFound = err?.status === 404;
        this.loadingVersions = false;
        this.cdr.markForCheck();
      }
    });
  }

  selectVersion(version: SupplierVersionSummaryDto): void {
    if (!this.selectedSupplier) return;
    this.selectedVersion = version;
    this.detail = null;
    this.rows = [];
    this.loadingDetail = true;
    this.detailError = false;
    this.detailNotFound = false;
    this.service.getVersionDetail(this.selectedSupplier.id, version.versionNumber).subscribe({
      next: d => {
        this.detail = d;
        this.rows = this.buildRows(d);
        this.loadingDetail = false;
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.detailError = true;
        this.detailNotFound = err?.status === 404;
        this.loadingDetail = false;
        this.cdr.markForCheck();
      }
    });
  }

  closeDetail(): void {
    this.selectedVersion = null;
    this.detail = null;
    this.rows = [];
    this.detailError = false;
    this.detailNotFound = false;
  }

  /** Builds side-by-side rows from versionBank/currentBank + diffs. Values shown as received (sensitive already masked). */
  buildRows(d: SupplierVersionDetailDto): ComparisonRow[] {
    const diffs = new Map((d.diffs ?? []).map(x => [toCamel(x.field), x]));
    return BANK_FIELDS.map(field => {
      const diff = diffs.get(field);
      return {
        field,
        versionValue: d.versionBank?.[field] ?? null,
        currentValue: d.currentBank?.[field] ?? null,
        differsFromCurrent: !!diff?.differsFromCurrent,
        changedInVersion: !!diff?.changedInVersion,
        sensitive: SENSITIVE_FIELDS.includes(field)
      };
    });
  }

  display(value: string | null | undefined): string {
    return value === null || value === undefined || value === '' ? '—' : value;
  }

  /** Accepts snake_case (changedFields) or camelCase field names. */
  fieldLabelKey(field: string): string {
    return 'supplierHistory.fields.' + toCamel(field);
  }

  private clearSelection(): void {
    this.selectedSupplier = null;
    this.versions = [];
    this.versionsTotal = 0;
    this.versionsError = false;
    this.versionsNotFound = false;
    this.closeDetail();
  }
}
