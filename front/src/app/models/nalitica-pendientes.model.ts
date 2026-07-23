export interface AnaliticaPendientesArchivoDTO {
  nombreArchivo: string;
  cantidadPagos: number;
  montoTotal: number;
  empresas: AnaliticaPendientesEmpresaDTO[];
}

export interface AnaliticaPendientesEmpresaDTO {
  empresa: string;
  cantidadPagos: number;
  montoTotal: number;
  tiposPago: AnaliticaPendientesTipoPagoDTO[];
}

export interface AnaliticaPendientesTipoPagoDTO {
  tipoPago: string;
  cantidadPagos: number;
  montoTotal: number;
  monedas: AnaliticaPendientesMonedaDTO[];
}

export interface AnaliticaPendientesMonedaDTO {
  moneda: string;
  cantidadPagos: number;
  montoTotal: number;
}