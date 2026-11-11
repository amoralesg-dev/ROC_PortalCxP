import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page } from './pago.service';

/** Bank fields (camelCase, as returned in versionBank/currentBank). */
export const BANK_FIELDS = [
  'beneficiaryBankName',
  'beneficiaryAccountName',
  'accountNumber',
  'bankCurrency',
  'bankCountry',
  'routingCodeAba',
  'routingCodeSwift',
  'intermediaryBankName',
  'intermediaryAccount',
  'intermediaryAccountCountry',
  'intermediaryRoutingCodeAba',
  'intermediaryRoutingCodeSwift'
] as const;

export type BankField = (typeof BANK_FIELDS)[number];
export type BankData = Partial<Record<BankField, string | null>>;

/** Fields already masked by the backend (the client never unmasks). */
export const SENSITIVE_FIELDS: string[] = ['accountNumber', 'intermediaryAccount', 'routingCodeAba', 'intermediaryRoutingCodeAba'];

export type SortOrder = 'ASC' | 'DESC';

export interface SupplierSearchFilter {
  supplierId?: number | null;
  supplierCode?: string;
  supplierName?: string;
  taxId?: string;
  page?: number;
  size?: number;
  sortField?: 'id' | 'supplierCode' | 'erpIdQad' | 'supplierName' | 'rfc' | 'businessUnitCode';
  sortOrder?: SortOrder;
}

export interface SupplierSummaryDto {
  id: number;
  supplierCode: string;
  erpIdQad?: string;
  supplierName: string;
  rfc?: string;
  businessUnitCode?: string;
  accountNumber?: string; // masked
  bankCurrency?: string;
  bankName?: string;
  versionCount: number;
}

export interface SupplierVersionSummaryDto {
  supplierId: number;
  supplierCode?: string;
  supplierName?: string;
  versionNumber: number;
  createdAt: string;
  current: boolean;
  changedFields: string[]; // snake_case
  versionSource?: string;
}

export interface SupplierVersionsResponse {
  current: { supplierId: number; supplierCode?: string; supplierName?: string; current: boolean; [k: string]: unknown };
  versions: Page<SupplierVersionSummaryDto>;
}

export interface SupplierFieldDiffDto {
  field: string; // snake_case
  differsFromCurrent: boolean;
  changedInVersion: boolean;
}

export interface SupplierVersionDetailDto {
  supplierId: number;
  supplierCode?: string;
  erpIdQad?: string;
  supplierName?: string;
  rfc?: string;
  businessUnitCode?: string;
  versionNumber: number;
  createdAt: string;
  versionSource?: string;
  changedFields: string[];
  versionBank: BankData;
  currentBank: BankData;
  diffs: SupplierFieldDiffDto[];
}

/** snake_case column name -> camelCase bank field (routing_code_swift -> routingCodeSwift). */
export function toCamel(field: string): string {
  return (field || '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

@Injectable({ providedIn: 'root' })
export class SupplierHistoryService {
  private readonly baseUrl = `${environment.baseUrl}/suppliers`;

  constructor(private readonly http: HttpClient) {}

  searchSuppliers(filter: SupplierSearchFilter): Observable<Page<SupplierSummaryDto>> {
    let params = new HttpParams().set('page', String(filter.page ?? 0)).set('size', String(filter.size ?? 10));
    if (filter.supplierId != null) params = params.set('supplierId', String(filter.supplierId));
    if (filter.supplierCode?.trim()) params = params.set('supplierCode', filter.supplierCode.trim());
    if (filter.supplierName?.trim()) params = params.set('supplierName', filter.supplierName.trim());
    if (filter.taxId?.trim()) params = params.set('taxId', filter.taxId.trim());
    if (filter.sortField) params = params.set('sortField', filter.sortField);
    if (filter.sortOrder) params = params.set('sortOrder', filter.sortOrder);
    return this.http.get<Page<SupplierSummaryDto>>(this.baseUrl, { params });
  }

  getVersions(
    supplierId: number,
    page = 0,
    size = 10,
    sortField: 'versionNumber' | 'createdAt' = 'versionNumber',
    sortOrder: SortOrder = 'DESC'
  ): Observable<SupplierVersionsResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sortField', sortField)
      .set('sortOrder', sortOrder);
    return this.http.get<SupplierVersionsResponse>(`${this.baseUrl}/${supplierId}/versions`, { params });
  }

  getVersionDetail(supplierId: number, versionNumber: number): Observable<SupplierVersionDetailDto> {
    return this.http.get<SupplierVersionDetailDto>(`${this.baseUrl}/${supplierId}/versions/${versionNumber}`);
  }
}
