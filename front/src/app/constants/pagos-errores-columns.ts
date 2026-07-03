import { DataTableColumn } from 'rassini-ui';

export const PAGOS_ERRORES_COLUMNS: DataTableColumn[] = [
    {
        field: 'id',
        header: 'Folio',
        sortable: true
    },
    {
        field: 'codigoProveedor',
        header: 'Proveedor',
        sortable: true
    },
    {
        field: 'rfcBeneficiario',
        header: 'RFC',
        sortable: true
    },
    {
        field: 'nombreBeneficiario',
        header: 'Nombre',
        sortable: true
    },
    {
        field: 'monto',
        header: 'Monto',
        sortable: true
    },
    {
        field: 'moneda',
        header: 'Moneda',
        sortable: true
    },
    {
        field: 'referencia',
        header: 'Referencia',
        sortable: true
    },
    {
        field: 'nombreArchivo',
        header: 'Archivo',
        sortable: true
    },
    {
        field: 'actions',
        header: 'Acciones',
        type: 'actions'
    }
];