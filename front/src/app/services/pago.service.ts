import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private baseUrl = 'http://localhost:8081/portal';

  constructor(private http: HttpClient) {}

  getPagosPendientesFiltro(): Observable<PagoDto[]> {
    // Default GET request, user did not provide POST body despite name filter, assuming GET or ignoring body for now, or maybe it's a POST if it requires a body? User didn't specify. Assuming GET like standard unless specified.
    // Usually 'filtro' implies a POST, but maybe it's just GET returning the json. Let's make it GET.
    return this.http.get<PagoDto[]>(`${this.baseUrl}/pagos/pendientes/filtro`);
  }
}
