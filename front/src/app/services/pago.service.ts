import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActualizarReferenciasManualDTO } from '../components/pagos-table/pagos-table';
import { AnaliticaPendientesArchivoDTO } from '../models/nalitica-pendientes.model';


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
  nombreArchivoEnvio?: string;
  tipoPago: string;
  mensaje?: string;
  estatus?: string;
  referenciaManual?: string;

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
export interface ValidacionEnvioDTO {
  permitido: boolean;
  errores: string[];
}
export interface ClasificarPagoItem {
  id: number;
  dealType: string;
}
export interface ClasificarPagosRequest {
  items: ClasificarPagoItem[];
}
@Injectable({ providedIn: 'root' })
export class PagoService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }
  getCatalogosTipoPago(): Observable<TipoPagoDto[]> {
    return this.http.get<TipoPagoDto[]>(`${this.baseUrl}/catalogos/tipo-pago`);
  }
  getPagosPendientesFiltro(
    codigoProveedor?: string,
    rfcBeneficiario?: string,
    tipoPago?: string,
    estatus?: string,
    page: number = 0,
    size: number = 10,
  ): Observable<Page<PagoDto>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (codigoProveedor) {
      params = params.set('codigoProveedor', codigoProveedor);
    }
    if (rfcBeneficiario) {
      params = params.set('rfcBeneficiario', rfcBeneficiario);
    }


    if (tipoPago && tipoPago !== 'Todos' && tipoPago !== '') {
      params = params.set('tipoPago', tipoPago);
    }
    if (estatus && estatus !== 'Todos' && estatus !== '') {
      params = params.set('estatus', estatus);
    }
    const authBu = sessionStorage.getItem('auth_bu');
    if (authBu) {
      params = params.set('bu', authBu);
    }
    return this.http.get<Page<PagoDto>>(`${this.baseUrl}/pagos/pendientes/filtro/paginado`, {
      params,
    });
  }
  getPagosEnviadosFiltro(
    search?: string,
    fechaInicio?: string,
    fechaFin?: string,
    page: number = 0,
    size: number = 10,
    sortField?: string,
    sortOrder?: string
  ): Observable<Page<PagoDto>> {

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }

    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    if (sortField) {
      params = params.set('sortField', sortField);
    }

    if (sortOrder) {
      params = params.set('sortOrder', sortOrder);
    }

    const authBu = sessionStorage.getItem('auth_bu');

    if (authBu) {
      params = params.set('bu', authBu);
    }

    return this.http.get<Page<PagoDto>>(
      `${this.baseUrl}/pagos/enviados/filtro/paginado`,
      {
        params
      }
    );

  }
  clasificarPagos(request: ClasificarPagosRequest): Observable<string> {
    let params = new HttpParams();
    const authBu = sessionStorage.getItem('auth_bu');
    if (authBu) {
      params = params.set('bu', authBu);
    }
    return this.http.put(`${this.baseUrl}/pagos/clasificacion`, request, {
      params,
      responseType: 'text',
    });
  }
  validarPagos(): Observable<ValidacionEnvioDTO> {
    let params = new HttpParams();
    const authBu = sessionStorage.getItem('auth_bu');
    if (authBu) {
      params = params.set('bu', authBu);
    }
    return this.http.post<ValidacionEnvioDTO>(
        `${this.baseUrl}/pagos/validar`,
        {},
        { params }
      );
  }
  enviarPagos(): Observable<string> {
    let params = new HttpParams();
    const authBu = sessionStorage.getItem('auth_bu');
    if (authBu) {
      params = params.set('bu', authBu);
    }
    return this.http.post(`${this.baseUrl}/pagos/enviar`, {}, { params, responseType: 'text' });
  }

  getPagosErroresFiltro(
    search?: string,
    page: number = 0,
    size: number = 10,
    sortField?: string,
    sortOrder?: string
  ): Observable<Page<PagoDto>> {

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sortField) {
      params = params.set('sortField', sortField);
    }

    if (sortOrder) {
      params = params.set('sortOrder', sortOrder);
    }

    if (search) {
      params = params.set('search', search);
    }

    const authBu = sessionStorage.getItem('auth_bu');

    if (authBu) {
      params = params.set('bu', authBu);
    }

    return this.http.get<Page<PagoDto>>(
      `${this.baseUrl}/pagos/errores/filtro/paginado`,
      {
        params,
      }
    );
  }

  rechazarPago(id: number): Observable<string> {
    return this.http.put(
      `${this.baseUrl}/pagos/rechazar/${id}`,
      {},
      {
        responseType: 'text'
      }
    );
  }
  rechazarPagos(ids: number[]): Observable<string> {
    return this.http.put(
      `${this.baseUrl}/pagos/rechazar`,
      ids,
      {
        responseType: 'text'
      }
    );

  }

  actualizarReferenciaManual(
    id: number,
    referenciaManual: string
  ): Observable<string> {

    return this.http.put(
      `${this.baseUrl}/pagos/${id}/referencia-manual`,
      {
        referenciaManual
      },
      {
        responseType: 'text'
      }
    );
  }

actualizarReferenciasManuales(
    request: ActualizarReferenciasManualDTO
  ): Observable<string> {

    return this.http.put(
      `${this.baseUrl}/pagos/referencias-manuales`,
      request,
      {
        responseType: 'text'
      }
    );
  }

obtenerAnaliticaPendientes(): Observable<AnaliticaPendientesArchivoDTO[]> {

    let params = new HttpParams();

    const authBu = sessionStorage.getItem('auth_bu');

    if (authBu) {
      params = params.set('bu', authBu);
    }

    return this.http.get<
      AnaliticaPendientesArchivoDTO[]
    >(
      `${this.baseUrl}/pagos/analitica-pendientes`,
      {
        params
      }
    );
  }







}
