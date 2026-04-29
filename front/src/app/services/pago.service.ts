import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PagoDto {
  id: number;
  empresa: string;
  referencia: string;
  fechaEnvio: string;
  fechaValor: string;
  codigoProveedor: string;
  rfcBeneficiario: string;
  informacionAdicional: string | null;
  monto: string;
  moneda: string;
  tipoCambio: string;
  nombreBeneficiario: string;
  cuentaBeneficiario: string;
  nombreArchivo: string;
  tipoPago:string;
}

export interface Page<T> {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TipoPagoDto {
  id: number;
  dealType: string;
  descripcion: string;
  corpo: boolean;
  bu: string | null;
}

export interface ClasificarPagoItem {
  id: number;
  dealType: string;
}

export interface ClasificarPagosRequest {
  items: ClasificarPagoItem[];
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private baseUrl = 'http://localhost:8081/portal';

  constructor(private http: HttpClient) {}

  getCatalogosTipoPago(): Observable<TipoPagoDto[]> {
    return this.http.get<TipoPagoDto[]>(`${this.baseUrl}/catalogos/tipo-pago`);
  }

  getPagosPendientesFiltro(
    codigoProveedor?: string,
    rfcBeneficiario?: string,
    page: number = 0,
    size: number = 10
  ): Observable<Page<PagoDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (codigoProveedor) {
      params = params.set('codigoProveedor', codigoProveedor);
    }
    if (rfcBeneficiario) {
      params = params.set('rfcBeneficiario', rfcBeneficiario);
    }

    return this.http.get<Page<PagoDto>>(`${this.baseUrl}/pagos/pendientes/filtro/paginado`, { params });
  }

  clasificarPagos(request: ClasificarPagosRequest): Observable<string> {
    // Specify responseType as 'text' since the API returns a String directly, not JSON.
    return this.http.put(`${this.baseUrl}/pagos/clasificacion`, request, { responseType: 'text' });
  }
}
