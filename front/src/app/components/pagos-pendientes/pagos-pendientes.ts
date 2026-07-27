import {
    Component,
    ChangeDetectorRef,
    OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import {
    TableLazyLoadEvent,
    TablePageEvent
} from 'primeng/table';

import {
    TranslatePipe,
    TranslateService
} from '@ngx-translate/core';

import {
    PageHeaderComponent,
    PageToolbarComponent,
    PageContentComponent,
    DataTable,
    DataTableColumn,
    Toast
} from 'rassini-ui';

import {
    PagoService,
    PagoDto,
    Page,
    TipoPagoDto,
    ClasificarPagosRequest,
    ClasificarPagoItem
} from '../../services/pago.service';
import { ConfirmationService } from 'primeng/api';

export interface PagoPendienteRow {
    id: number;
    proveedor: string;
    rfc: string;
    nombre: string;
    monto: number;
    moneda: string;
    descripcion: string;
    archivo: string;
    estatus: string;
    tipo: string;
    referenciaManual: string;
    referenciaManualOriginal: string;
}

export interface ReferenciaManualItemDTO {
    id: number;
    referenciaManual: string;
}

export interface ActualizarReferenciasManualDTO {
    items: ReferenciaManualItemDTO[];
}

@Component({
    selector: 'app-pagos-pendientes',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        PageHeaderComponent,
        PageToolbarComponent,
        PageContentComponent,
        DataTable,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TooltipModule,
        TranslatePipe
    ],
    templateUrl: './pagos-pendientes.html',
    styleUrl: './pagos-pendientes.scss'
})
export class PagosPendientesComponent implements OnInit {

    columns: DataTableColumn[] = [];

    pagos: PagoPendienteRow[] = [];
    selectedRows: PagoPendienteRow[] = [];

    tiposDePagoCatalogo: TipoPagoDto[] = [];

    selectedTipo: string | number = 'Todos';

    codigoProveedorFiltro = '';
    rfcBeneficiarioFiltro = '';
    tipoPagoFiltro = 'Todos';
    estatusFiltro = 'Todos';

    pageIndex = 0;
    pageSize = 10;
    totalElements = 0;

    sortField = '';
    sortOrder = 1;

    pagosValidados = false;

    constructor(
        private readonly pagoService: PagoService,
        private readonly cdr: ChangeDetectorRef,
        private readonly toast: Toast,
        private readonly translate: TranslateService,
        private readonly confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.inicializarColumnas();
        this.cargarCatalogos();
        this.cargarPagos();
        this.validarPagosStatus();
    }

    private inicializarColumnas(): void {
        this.translate
            .get('pendingpage.tableColumns')
            .subscribe(columns => {

                this.columns = [
                    {
                        field: 'id',
                        header: columns?.folio
                            ?? this.translate.instant('pendingpage.folio'),
                        sortable: true,
                        width: '80px'
                    },
                    {
                        field: 'proveedor',
                        header: columns?.provider
                            ?? this.translate.instant('pendingpage.provider'),
                        sortable: true,
                        width: '100px'
                    },
                    {
                        field: 'rfc',
                        header: columns?.rfc
                            ?? this.translate.instant('pendingpage.rfc'),
                        sortable: true,
                        width: '120px'
                    },
                    {
                        field: 'nombre',
                        header: columns?.name
                            ?? this.translate.instant('pendingpage.name'),
                        sortable: true,
                        width: '120px',
                        truncateLength:10,
                        tooltip:true
                    },
                    {
                        field: 'monto',
                        header: columns?.totalAmount
                            ?? this.translate.instant('pendingpage.totalAmount'),
                        sortable: true,
                        width: '120px'
                    },
                    {
                        field: 'moneda',
                        header: columns?.currency
                            ?? this.translate.instant('pendingpage.currency'),
                        sortable: true,
                        width: '90px'
                    },
                    {
                        field: 'descripcion',
                        header: columns?.description
                            ?? this.translate.instant('pendingpage.description'),
                        sortable: true,
                        width: '120px',
                        styleClass: 'truncate-column',
                        truncateLength:8,
                        tooltip:true
                    },
                    {
                        field: 'archivo',
                        header: columns?.file
                            ?? this.translate.instant('pendingpage.file'),
                        sortable: true,
                        width: '120px',
                        truncateLength:6,
                        tooltip:true
                    },
                    {
                        field: 'tipo',
                        header: columns?.paymentTypeColumn
                            ?? this.translate.instant('pendingpage.paymentTypeColumn'),
                        sortable: true,
                        width: '110px'
                    },
                    {
                        field: 'referenciaManual',
                        header: columns?.reference
                            ?? this.translate.instant('pendingpage.reference'),
                        editable: true,
                        sortable: false,
                        width: '110px'
                    },
                    {
                        field: 'actions',
                        header: columns?.actions
                            ?? this.translate.instant('pendingpage.actions'),
                        type: 'actions',
                        width: '100px'
                    },
                    {
                        field: 'estatus',
                        header: columns?.statusColumn
                            ?? this.translate.instant('pendingpage.statusColumn'),
                        sortable: true,
                        width: '120px'
                    }
                ];

                this.cdr.detectChanges();
            });
    }

    cargarCatalogos(): void {
        this.pagoService
            .getCatalogosTipoPago()
            .subscribe({
                next: (data) => {

                    this.tiposDePagoCatalogo = [
                        {
                            dealType: 'NOT_SELECTED' as any,
                            descripcion: this.translate.instant(
                                'pendingpage.paymentTypeNotSelected'
                            )
                        } as any,
                        ...data
                    ];

                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error(
                        'Error al cargar catálogos',
                        error
                    );
                }
            });
    }

    cargarPagos(): void {
        this.pagoService
            .getPagosPendientesFiltro(
                this.codigoProveedorFiltro,
                this.rfcBeneficiarioFiltro,
                this.tipoPagoFiltro,
                this.estatusFiltro,
                this.pageIndex,
                this.pageSize
            )
            .subscribe({
                next: (data: Page<PagoDto>) => {

                    this.totalElements = data.totalElements;

                    this.pagos = data.content.map(item => ({
                        id: item.id,
                        proveedor: item.codigoProveedor || '',
                        rfc: item.rfcBeneficiario || '',
                        nombre: item.nombreBeneficiario || '',
                        monto: Number(item.monto) || 0,
                        moneda: item.moneda || '',
                        descripcion: item.referencia || '',
                        archivo: item.nombreArchivo || '',
                        estatus: item.estatus || '',
                        tipo: item.tipoPago || '',
                        referenciaManual: item.referenciaManual || '',
                        referenciaManualOriginal: item.referenciaManual || ''
                    }));

                    this.selectedRows = [];

                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error(
                        'Error al cargar pagos pendientes',
                        error
                    );
                }
            });
    }

    buscarPorFiltros(): void {

        this.pageIndex = 0;


        this.cargarPagos();

    }

    limpiarFiltros(): void {
        this.codigoProveedorFiltro = '';
        this.rfcBeneficiarioFiltro = '';
        this.tipoPagoFiltro = 'Todos';
        this.estatusFiltro = 'Todos';
        this.selectedTipo = 'Todos';
        this.pageIndex = 0;
        this.selectedRows = [];
        this.cargarPagos();
    }

    onSelectionChange(rows: PagoPendienteRow[]): void {
        this.selectedRows = rows;
    }

    onPage(event: TablePageEvent): void {
        this.pageIndex = Math.floor(
            (event.first ?? 0) /
            (event.rows ?? this.pageSize)
        );

        this.pageSize =
            event.rows ?? this.pageSize;

        this.cargarPagos();
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        this.pageIndex = Math.floor(
            (event.first ?? 0) /
            (event.rows ?? this.pageSize)
        );

        this.pageSize =
            event.rows ?? this.pageSize;

        this.sortField =
            event.sortField?.toString() ?? '';

        this.sortOrder =
            event.sortOrder ?? 1;

        this.cargarPagos();
    }

    onTipoChange(value: string | number): void {
        this.selectedTipo = value;
    }

    isGuardarDisabled(): boolean {
        return !this.selectedRows.length ||
            this.selectedTipo === 'Todos';
    }

    isEnviarDisabled(): boolean {
        return !this.pagosValidados;
    }

    guardar(): void {

        const items: ClasificarPagoItem[] =
            this.selectedRows.map(pago => ({
                id: pago.id,
                dealType:
                    this.selectedTipo !== 'Todos'
                        ? this.selectedTipo as string
                        : pago.tipo
            }));

        const request: ClasificarPagosRequest = {
            items
        };

        this.pagoService
            .clasificarPagos(request)
            .subscribe({
                next: () => {

                    this.toast.success(
                        this.translate.instant(
                            'pendingpage.saveSuccess'
                        ),
                        this.translate.instant(
                        'common.success'
                        )
                    );

                    this.selectedRows = [];
                    this.selectedTipo = 'Todos';
                    this.pagosValidados = false;

                    this.validarPagosStatus();
                    this.cargarPagos();
                },
                error: (error) => {

                    console.error(
                        'Error al clasificar los pagos:',
                        error
                    );

                    const errorMessage =
                        error.error?.message ||
                        this.translate.instant(
                            'pendingpage.saveError'
                        );

                    this.toast.error(errorMessage);
                }
            });
    }

    enviarPagos(): void {

        this.pagoService
            .enviarPagos()
            .subscribe({
                next: () => {

                    this.toast.success(
                        this.translate.instant(
                            'pendingpage.sendSuccess'
                        ),
                        this.translate.instant(
                        'common.success'
                        )
                    );

                    this.selectedRows = [];
                    this.pagosValidados = false;

                    this.cargarPagos();
                    this.cdr.detectChanges();
                },
                error: (error) => {

                    console.error(
                        'Error al enviar los pagos:',
                        error
                    );

                    const errorMessage =
                        error.error?.message ||
                        this.translate.instant(
                            'pendingpage.sendError'
                        );

                    this.toast.error(errorMessage);

                    this.cdr.detectChanges();
                }
            });
    }

    validarPagosStatus(): void {

        this.pagoService
            .validarPagos()
            .subscribe({
                next: (response) => {

                    this.pagosValidados =
                        response.permitido;

                    this.cdr.detectChanges();
                },
                error: (error) => {

                    console.error(
                        'Error al validar el estado de los pagos:',
                        error
                    );

                    this.pagosValidados = false;

                    const errorMessage =
                        error.error?.message ||
                        this.translate.instant(
                            'pendingpage.validationError'
                        );

                    this.toast.error(errorMessage);

                    this.cdr.detectChanges();
                }
            });
    }

    guardarReferencia(row: PagoPendienteRow): void {

        if (
            (row.referenciaManual || '') ===
            (row.referenciaManualOriginal || '')
        ) {

            this.toast.info(
                this.translate.instant(
                    'pendingpage.referenceManualNoChanges'
                ),
                this.translate.instant(
                    'common.information'
                )
            );

            return;
        }

        this.pagoService
            .actualizarReferenciaManual(
                row.id,
                row.referenciaManual
            )
            .subscribe({
                next: () => {

                    row.referenciaManualOriginal =
                        row.referenciaManual;

                    this.toast.success(
                        this.translate.instant(
                            'pendingpage.referenceManualSaveSuccess'
                        ),
                        this.translate.instant(
                        'common.success'
                        )
                    );
                },
                error: (error) => {

                    console.error(
                        'Error al guardar referencia manual',
                        error
                    );

                    const errorMessage =
                        error.error ||
                        this.translate.instant(
                            'pendingpage.referenceManualSaveError'
                        );

                    this.toast.error(errorMessage);
                }
            });
    }

    guardarReferenciasManuales(): void {

        const items = this.pagos
            .filter(
                pago =>
                    (pago.referenciaManual || '') !==
                    (pago.referenciaManualOriginal || '')
            )
            .map(pago => ({
                id: pago.id,
                referenciaManual: pago.referenciaManual
            }));

        if (!items.length) {

            this.toast.info(
                this.translate.instant(
                    'pendingpage.referenceManualNoChanges'
                ),
                this.translate.instant(
                    'common.information'
                )
            );

            return;
        }

        const request: ActualizarReferenciasManualDTO = {
            items
        };

        this.pagoService
            .actualizarReferenciasManuales(request)
            .subscribe({
                next: () => {

                    this.pagos.forEach(pago => {

                        const actualizado = items.find(
                            item => item.id === pago.id
                        );

                        if (actualizado) {
                            pago.referenciaManualOriginal =
                                pago.referenciaManual;
                        }
                    });

                    this.toast.success(
                        this.translate.instant(
                            'pendingpage.manualReferencesSaveSuccess'
                        ),
                        this.translate.instant(
                        'common.success'
                        )
                    );
                },
                error: (error) => {

                    console.error(
                        'Error al guardar referencias manuales',
                        error
                    );

                    const errorMessage =
                        error.error ||
                        this.translate.instant(
                            'pendingpage.manualReferencesSaveError'
                        );

                    this.toast.error(errorMessage);
                }
            });
    }

    rechazarRegistro(row: PagoPendienteRow): void {
        this.confirmationService.confirm({
            header: this.translate.instant(
                'pendingpage.confirmRejectTitle'
            ),
            message:
                this.translate.instant(
                    'pendingpage.confirmRejectMessage'
                ),
            acceptLabel: this.translate.instant(
                'pendingpage.reject'
            ),
            rejectLabel: this.translate.instant(
                'pendingpage.cancel'
            ),
            acceptButtonProps: {
                severity: 'danger'
            },
            rejectButtonProps: {
                severity: 'secondary'
            },
            accept: () => {
                this.pagoService
                    .rechazarPago(row.id)
                    .subscribe({
                        next: () => {

                            this.toast.success(
                                this.translate.instant(
                                    'pendingpage.successReject'
                                ),
                                this.translate.instant(
                                    'common.success'
                                )
                            );

                            this.cargarPagos();
                        },
                        error: () => {

                            this.toast.error(
                                this.translate.instant(
                                    'pendingpage.errorReject'
                                ),
                                this.translate.instant(
                                    'common.error'
                                )
                            );

                        }
                    });
            }
        });
    }

    rechazarSeleccionados(): void {
        const ids = this.selectedRows.map(
            row => row.id
        );

        if (!ids.length) {
            return;
        }

        this.confirmationService.confirm({
            header: this.translate.instant(
                'pendingpage.confirmRejectMultipleTitle'
            ),
            message:
                this.translate.instant(
                    'pendingpage.confirmRejectMultipleMessage',
                    {
                        count: ids.length
                    }
                ),
            acceptLabel: this.translate.instant(
                'pendingpage.reject'
            ),
            rejectLabel: this.translate.instant(
                'pendingpage.cancel'
            ),
            acceptButtonProps: {
                severity: 'danger'
            },
            rejectButtonProps: {
                severity: 'secondary'
            },
            accept: () => {

                this.pagoService
                    .rechazarPagos(ids)
                    .subscribe({
                        next: () => {

                            this.toast.success(
                                this.translate.instant(
                                    'pendingpage.successRejectMultiple'
                                ),
                                this.translate.instant(
                                    'common.success'
                                )
                            );

                            this.selectedRows = [];
                            this.cargarPagos();
                        },
                        error: () => {

                            this.toast.error(
                                this.translate.instant(
                                    'pendingpage.errorRejectMultiple'
                                ),
                                this.translate.instant(
                                    'common.error'
                                )
                            );

                        }
                    });

            }
        });
    }
}