import {
    Component,
    ChangeDetectorRef,
    OnInit,
    ViewChild,
    DestroyRef,
    inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import {
    TableModule,
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
import { AuthService, BuDto } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    bu?: string;
    fechaEnvio?: string;
    tipoPagoSeleccionado?: string;
    tipoPagoSeleccionadoOriginal?: string;
    tieneAba?: boolean;
    tieneSwift?: boolean;
    opcionesTipoPago?: string[];
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
        TableModule,
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
    readonly opcionesTipoPago = [
        { label: 'ACH - ABA', value: 'ACH' },
        { label: 'Wire - SWIFT', value: 'WIRE' }
    ];

    guardandoTipoPagoIndividualId: number | null = null;
    guardandoTipoPagoMasivo = false;

    codigoProveedorFiltro = '';
    rfcBeneficiarioFiltro = '';
    tipoPagoFiltro = 'Todos';
    monedaFiltro = '';
    montoFiltro = '';
    proveedorFiltro = '';
    buFiltro = '';
    busDisponibles: BuDto[] = [];

    pageIndex = 0;
    pageSize = 10;
    totalElements = 0;

    sortField = '';
    sortOrder = 1;

    pagosValidados = false;

    private readonly sortFieldMap: Record<string, string> = {
        id: 'id',
        bu: 'empresa',
        fechaEnvio: 'fechaEnvio',
        proveedor: 'codigoProveedor',
        rfc: 'rfcBeneficiario',
        nombre: 'nombreBeneficiario',
        monto: 'monto',
        moneda: 'moneda',
        descripcion: 'referencia',
        archivo: 'nombreArchivo',
        tipo: 'tipoPago',
        estatus: 'estatus'
    };

    private readonly destroyRef = inject(DestroyRef);
    private readonly authService = inject(AuthService);

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
        
        const usuario = sessionStorage.getItem('auth_usuario') || '';
        if (usuario) {
            this.authService.getUserBus(usuario).subscribe(bus => {
                this.busDisponibles = bus;
                const allBu = bus.find(b => b.codigo === 'ALL');
                if (allBu) {
                    this.buFiltro = 'ALL';
                } else if (bus.length > 0) {
                    this.buFiltro = bus[0].codigo;
                }
                this.cdr.detectChanges();
                this.pageIndex = 0;
                this.selectedRows = [];
                this.pagosValidados = false;
                this.cargarPagos();
                this.validarPagosStatus();
            });
        }
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
                        field: 'bu',
                        header: columns?.bu
                            ?? 'BU',
                        sortable: true,
                        width: '85px'
                    },
                    {
                        field: 'fechaEnvio',
                        header: columns?.sentDate
                            ?? 'FECHA ENVÍO',
                        sortable: true,
                        width: '120px'
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
                        width: '115px'
                    },
                    {
                        field: 'tipoPagoSeleccionado',
                        header: columns?.tipoPagoSeleccionadoColumn
                            ?? this.translate.instant('pendingpage.tipoPagoSeleccionadoColumn'),
                        type: 'tipoPago' as any,
                        sortable: false,
                        width: '160px'
                    },

                    {
                        field: 'actions',
                        header: columns?.actions
                            ?? this.translate.instant('pendingpage.actions'),
                        type: 'actions',
                        width: '120px'
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
        const backendSortField = this.sortField ? (this.sortFieldMap[this.sortField] ?? this.sortField) : '';
        const sortDirection = this.sortOrder === 1 ? 'ASC' : 'DESC';

        this.pagoService
            .getPagosPendientesFiltro(
                this.codigoProveedorFiltro,
                this.rfcBeneficiarioFiltro,
                this.tipoPagoFiltro,
                this.pageIndex,
                this.pageSize,
                this.monedaFiltro,
                this.montoFiltro,
                this.proveedorFiltro,
                this.buFiltro,
                backendSortField,
                sortDirection
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
                        referenciaManualOriginal: item.referenciaManual || '',
                        bu: (item as any).bu || '',
                        fechaEnvio: item.fechaEnvio || '',
                        tipoPagoSeleccionado: (item as any).tipoPagoSeleccionado ?? undefined,
                        tipoPagoSeleccionadoOriginal: (item as any).tipoPagoSeleccionado ?? undefined,
                        tieneAba: item.tieneAba,
                        tieneSwift: item.tieneSwift,
                        opcionesTipoPago: item.opcionesTipoPago
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
        this.selectedTipo = 'Todos';
        this.monedaFiltro = '';
        this.montoFiltro = '';
        this.proveedorFiltro = '';
        this.pageIndex = 0;
        
        const allBu = this.busDisponibles.find(b => b.codigo === 'ALL');
        if (allBu) {
            this.buFiltro = 'ALL';
        } else if (this.busDisponibles.length > 0) {
            this.buFiltro = this.busDisponibles[0].codigo;
        } else {
            this.buFiltro = '';
        }
        
        this.selectedRows = [];
        this.cargarPagos();
    }

    onSelectionChange(rows: PagoPendienteRow[]): void {
        console.log('[SELECCION]', rows);
        this.selectedRows = rows || [];
        this.cdr.detectChanges();
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
            .clasificarPagos(request, this.buFiltro)
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
        this.selectedRows = [];
    }

    enviarPagos(): void {

        this.pagoService
            .enviarPagos(this.buFiltro)
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

                    this.selectedRows = [];

                    const errorMessage = this.extractErrorMessage(
                        error,
                        this.translate.instant('pendingpage.sendError') || 'Error al enviar los pagos'
                    );

                    this.toast.error(errorMessage);

                    this.cdr.detectChanges();
                }
            });
    }

    validarPagosStatus(): void {

        this.pagoService
            .validarPagos(this.buFiltro)
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

                    const errorMessage = this.extractErrorMessage(
                        error,
                        this.translate.instant('pendingpage.validationError') || 'Error al validar pagos'
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

                    const errorMessage = this.extractErrorMessage(
                        error,
                        this.translate.instant('pendingpage.referenceManualSaveError') || 'Error al guardar referencia manual'
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
                    this.selectedRows = [];
                },
                error: (error) => {

                    console.error(
                        'Error al guardar referencias manuales',
                        error
                    );

                    const errorMessage = this.extractErrorMessage(
                        error,
                        this.translate.instant('pendingpage.manualReferencesSaveError') || 'Error al guardar referencias manuales'
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
                            this.cdr.detectChanges();
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

    /**
     * Guarda el tipo de pago de una fila individual.
     * Sigue exactamente el mismo patrón que guardarReferencia(row).
     */
    guardarTipoPagoFila(row: PagoPendienteRow): void {
        if (this.guardandoTipoPagoIndividualId !== null || this.guardandoTipoPagoMasivo) {
            return;
        }

        const tipo = row.tipoPagoSeleccionado;
        if (!tipo || (tipo !== 'ACH' && tipo !== 'WIRE')) {
            this.toast.error(
                this.translate.instant('pendingpage.tipoPagoInvalido') ||
                    'El tipo de pago seleccionado es inválido. Use ACH o WIRE.'
            );
            row.tipoPagoSeleccionado = row.tipoPagoSeleccionadoOriginal;
            return;
        }

        if ((tipo || '') === (row.tipoPagoSeleccionadoOriginal || '')) {
            this.toast.info(
                this.translate.instant('pendingpage.sinCambiosTipoPago') ||
                    'El pago ya tiene asignado este tipo de pago.',
                this.translate.instant('common.information')
            );
            return;
        }

        const valorPrevio = row.tipoPagoSeleccionadoOriginal;
        this.guardandoTipoPagoIndividualId = row.id;

        this.pagoService
            .actualizarTipoPagoSeleccionado(row.id, tipo)
            .pipe(
                finalize(() => {
                    this.guardandoTipoPagoIndividualId = null;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    row.tipoPagoSeleccionadoOriginal = tipo;
                    this.toast.success(
                        this.translate.instant('pendingpage.tipoPagoSaveSuccess') ||
                            'Tipo de pago actualizado correctamente.',
                        this.translate.instant('common.success')
                    );
                },
                error: (error) => {
                    console.error('Error al actualizar tipo de pago seleccionado', error);
                    row.tipoPagoSeleccionado = valorPrevio;
                    const errorMessage = this.extractErrorMessage(
                        error,
                        this.translate.instant('pendingpage.tipoPagoSaveError') || 'Error al actualizar tipo de pago.'
                    );
                    this.toast.error(errorMessage);
                }
            });
    }

    /**
     * Determina de forma centralizada si una empresa (o su empresa padre)
     * participa en la funcionalidad de selección ACH/WIRE.
     * Plantas habilitadas por negocio: 1850 y 09 (incluye hijas como 02, 72, 10).
     */
    aplicaTransferenciaAchWire(empresa?: string): boolean {
        if (!empresa) {
            return false;
        }
        const limpia = empresa.trim();
        const plantasHabilitadas = ['1850', '09', '02', '72', '10'];
        return plantasHabilitadas.includes(limpia);
    }

    /**
     * Construye dinámicamente las opciones del selector de tipo de transferencia
     * según los datos y códigos del proveedor asociados a la fila:
     * - Caso 1 (ABA + SWIFT): [ACH - ABA, Wire - SWIFT]
     * - Caso 2 (ABA sin SWIFT): [ACH - ABA]
     * - Caso 3 (sin ABA con SWIFT): [Wire - SWIFT]
     * - Caso 4 (sin ABA ni SWIFT): []
     */
    getOpcionesTipoPagoFila(row: PagoPendienteRow): { label: string; value: string }[] {
        if (!row) {
            return [];
        }
        if (row.opcionesTipoPago && row.opcionesTipoPago.length > 0) {
            return this.opcionesTipoPago.filter(opt => row.opcionesTipoPago!.includes(opt.value));
        }
        if (row.tieneAba !== undefined || row.tieneSwift !== undefined) {
            const result: { label: string; value: string }[] = [];
            if (row.tieneAba) {
                result.push({ label: 'ACH - ABA', value: 'ACH' });
            }
            if (row.tieneSwift) {
                result.push({ label: 'Wire - SWIFT', value: 'WIRE' });
            }
            return result;
        }
        // Fallback por defecto si no vienen banderas
        return this.opcionesTipoPago;
    }

    /**
     * Comprueba si hay al menos una fila cuyo tipoPagoSeleccionado difiere del original
     * y cuya empresa participe en la funcionalidad ACH/WIRE.
     */
    tieneTiposPagoModificados(): boolean {
        return this.pagos.some(
            p => this.aplicaTransferenciaAchWire(p.bu) &&
                 (p.tipoPagoSeleccionado || '') !== (p.tipoPagoSeleccionadoOriginal || '')
        );
    }

    /**
     * Guarda los tipos de pago modificados enviando solo los registros que cambiaron
     * y pertenecen a empresas autorizadas.
     * Sigue exactamente el mismo patrón de guardarReferenciasManuales.
     */
    guardarTiposPago(): void {
        const modificados = this.pagos.filter(
            p => this.aplicaTransferenciaAchWire(p.bu) &&
                 (p.tipoPagoSeleccionado || '') !== (p.tipoPagoSeleccionadoOriginal || '')
        );

        if (!modificados.length) {
            this.toast.info(
                this.translate.instant('pendingpage.sinCambiosTipoPago') ||
                    'No se detectaron cambios en los tipos de pago.',
                this.translate.instant('common.information')
            );
            return;
        }

        if (this.guardandoTipoPagoMasivo) {
            return;
        }

        const items = modificados.map(p => ({
            id: p.id,
            tipoPagoSeleccionado: p.tipoPagoSeleccionado as string
        }));

        this.guardandoTipoPagoMasivo = true;

        this.pagoService
            .actualizarTiposPagoSeleccionados({ items })
            .pipe(
                finalize(() => {
                    this.guardandoTipoPagoMasivo = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    modificados.forEach(p => {
                        p.tipoPagoSeleccionadoOriginal = p.tipoPagoSeleccionado;
                    });

                    this.toast.success(
                        this.translate.instant('pendingpage.tiposPagoSaveSuccess') ||
                            'Tipos de pago actualizados correctamente.',
                        this.translate.instant('common.success')
                    );
                },
                error: (error) => {
                    console.error('Error al actualizar tipos de pago', error);
                    const errorMessage = this.extractErrorMessage(
                        error,
                        this.translate.instant('pendingpage.tiposPagoSaveError') || 'Error al actualizar tipos de pago.'
                    );
                    this.toast.error(errorMessage);
                }
            });
    }

    /**
     * Extrae de forma robusta el mensaje de error funcional enviado por el backend
     * soportando respuestas JSON directas, respuestas de texto con JSON serializado,
     * o texto plano. Evita que errores funcionales (como validaciones de layout)
     * se muestren como HTTP 400 genéricos o se pierdan silenciosamente.
     */
    private extractErrorMessage(error: any, fallbackMessage: string): string {
        if (!error) {
            return fallbackMessage;
        }

        // Si el objeto de error contiene directamente la propiedad .error
        if (error.error !== undefined && error.error !== null) {
            // Caso 1: error.error es un string que puede ser JSON serializado o texto plano
            if (typeof error.error === 'string') {
                const trimmed = error.error.trim();
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
                            return parsed.message.trim();
                        }
                    } catch (_) {
                        // Si falla el parseo JSON, usar el string tal cual si no está vacío
                    }
                }
                if (trimmed) {
                    return trimmed;
                }
            } else if (typeof error.error === 'object') {
                // Caso 2: error.error es un objeto JSON (ErrorResponse de Spring Boot)
                if (typeof error.error.message === 'string' && error.error.message.trim()) {
                    return error.error.message.trim();
                }
                if (typeof error.error.error === 'string' && error.error.error.trim()) {
                    return error.error.error.trim();
                }
            }
        }

        // Caso 3: mensaje a nivel superior del objeto error (HttpErrorResponse.message)
        if (typeof error.message === 'string' && error.message.trim() && !error.message.startsWith('Http failure response')) {
            return error.message.trim();
        }

        return fallbackMessage;
    }
}