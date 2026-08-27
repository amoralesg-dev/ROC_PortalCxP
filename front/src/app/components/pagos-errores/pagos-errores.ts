import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import {
  PagoService,
  PagoDto,
  Page,
  TipoPagoDto
} from '../../services/pago.service';
import { ChangeDetectorRef } from '@angular/core';
import { ERROR_MESSAGES } from '../../constants/error-messages';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { TablePageEvent } from 'primeng/table';
import { TableLazyLoadEvent } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { DecimalPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService, BuDto } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import {
  PageHeaderComponent,
  PageToolbarComponent,
  PageContentComponent,
  DataTable,
  AppDialog,
  Toast,
  DataTableColumn
} from 'rassini-ui';

@Component({
  selector: 'app-pagos-errores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    InputTextModule,
    PageHeaderComponent,
    PageToolbarComponent,
    PageContentComponent,
    DataTable,
    AppDialog,
    ButtonModule,
    TooltipModule,
    DatePickerModule,
    TranslatePipe,
    DecimalPipe
  ],
  templateUrl: './pagos-errores.html',
  styleUrl: './pagos-errores.scss'
})
export class PagosErroresComponent {

    pageIndex = 0;
    pageSize = 10;
    totalElements = 0;
    sortField = '';
    sortOrder = 1;

    buFiltro = '';
    busDisponibles: BuDto[] = [];
    proveedorFiltro = '';
    rfcBeneficiarioFiltro = '';
    tipoPagoFiltro = '';
    monedaFiltro = '';
    montoFiltro = '';
    tiposDePagoCatalogo: TipoPagoDto[] = [];

    //reports
    totalRegistros = 0;
    totalArchivos = 0;
    totalEstatusError = 0;
    totalErrores = 0;
    fechaInicio: Date | null = null;
    fechaFin: Date | null = null;

    totalesPorMoneda: Record<string, number> = {};
    monedas: string[] = [];

    
    private readonly destroyRef = inject(DestroyRef);
    private readonly authService = inject(AuthService);

    ngOnInit(): void {

        this.inicializarColumnas();
        this.cargarCatalogos();
        this.loadErrorsMessages();

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
                this.pageIndex = 0;
                this.selectedRows = [];
                this.cargarErrores();
            });
        }

    }

    buscarPorFiltros(): void {
        this.pageIndex = 0;
        this.selectedRows = [];
        this.cargarErrores();
    }

    limpiarFiltros(): void {
        this.proveedorFiltro = '';
        this.rfcBeneficiarioFiltro = '';
        this.tipoPagoFiltro = '';
        this.monedaFiltro = '';
        this.montoFiltro = '';
        this.fechaInicio = null;
        this.fechaFin = null;

        const allBu = this.busDisponibles.find(b => b.codigo === 'ALL');
        if (allBu) {
            this.buFiltro = 'ALL';
        } else if (this.busDisponibles.length > 0) {
            this.buFiltro = this.busDisponibles[0].codigo;
        } else {
            this.buFiltro = '';
        }

        this.pageIndex = 0;
        this.selectedRows = [];
        this.cargarErrores();
    }

    private formatDate(date: Date | null): string {
        if (!date) return '';
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }



    constructor(private readonly pagoService: PagoService,
                private readonly cdr: ChangeDetectorRef,
                private readonly confirmationService: ConfirmationService,
                private readonly toast: Toast,
                private readonly translate: TranslateService) 
    {
    }

    columns: DataTableColumn[] = [];


    mostrarErroresDialog = false;

    erroresDetalle: string[] = [];

    errores: PagoDto[] = [];

    selectedRows: PagoDto[] = [];

    errorMessagesTraducidos: Record<string, string> = {};

    onSelectionChange(rows: PagoDto[]): void {
        this.selectedRows = rows;
    }

    verErrores(row: PagoDto): void {

        this.erroresDetalle =
            row.mensaje
                ? row.mensaje.split('|')
                .map((error: string) => error.trim())
                : [];

        this.mostrarErroresDialog = true;

    }

    readonly mensajesError = ERROR_MESSAGES;

    
    obtenerDescripcionError(codigo: string): string {

        return this.errorMessagesTraducidos[codigo]
            ?? codigo;

    }


    rechazarRegistro(row: PagoDto): void {

        this.confirmationService.confirm({

            header: this.translate.instant(
                'errorpage.confirmRejectTitle'
            ),

            message:
                this.translate.instant('errorpage.confirmRejectMessage') +
                '<br><br><strong>' +
                this.translate.instant('errorpage.importantMessage')+'</strong>',

            acceptLabel: this.translate.instant(
                'errorpage.reject'
            ),

            rejectLabel: this.translate.instant(
                'errorpage.cancel'
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
                                    'errorpage.successReject'
                                ),
                                this.translate.instant(
                                'common.success'
                                )
                            );

                            this.cargarErrores();

                        },

                        error: () => {

                            this.toast.error(
                                this.translate.instant(
                                    'errorpage.errorReject'
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
            (row: any) => row.id
        );

        

        if (!ids.length) {
            return;
        }

        this.confirmationService.confirm({

            header: this.translate.instant(
                'errorpage.confirmRejectMultipleTitle'
            ),

            message:
                this.translate.instant(
                    'errorpage.confirmRejectMultipleMessage',
                    {
                        count: ids.length
                    }
                ) +
                '<br><br><strong>' +
                this.translate.instant('errorpage.importantMessage')+'</strong>',

            acceptLabel: this.translate.instant(
                'errorpage.reject'
            ),

            rejectLabel: this.translate.instant(
                'errorpage.cancel'
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
                                    'errorpage.successRejectMultiple'
                                ),
                                this.translate.instant(
                                'common.success'
                                )
                            );

                            this.selectedRows = [];

                            this.cargarErrores();

                        },

                        error: () => {

                            this.toast.error(
                                this.translate.instant(
                                    'errorpage.errorRejectMultiple'
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

    cargarErrores(): void {

        const finalBu = (this.buFiltro && this.buFiltro !== 'ALL') ? this.buFiltro : (sessionStorage.getItem('auth_bu') || '');
        this.pagoService
            .getPagosErroresFiltro(
                '', // codigoProveedor
                this.rfcBeneficiarioFiltro,
                this.tipoPagoFiltro,
                this.monedaFiltro,
                this.montoFiltro,
                this.proveedorFiltro,
                this.formatDate(this.fechaInicio),
                this.formatDate(this.fechaFin),
                this.pageIndex,
                this.pageSize,
                this.sortField,
                this.sortOrder === 1 ? 'ASC' : 'DESC',
                finalBu
            ).subscribe({

                next: (data: Page<PagoDto>) => {
                    this.totalElements = data.totalElements;

                    this.errores = data.content.map((item: PagoDto) => ({

                        ...item,

                        errores: item.mensaje
                            ? (() => {

                                const errores = item.mensaje
                                    .split('|')
                                    .map((e: string) => e.trim());

                                return errores.length > 2
                                    ? `${errores.slice(0, 2).join(', ')}...`
                                    : errores.join(', ');

                            })()
                            : ''

                    }));
                    this.totalRegistros = data.totalElements;

                    this.totalArchivos = new Set(
                        data.content.map((item: PagoDto) => item.nombreArchivo)
                    ).size;

                    this.totalEstatusError = data.totalElements;

                    this.totalErrores = data.content.reduce(
                        (total: number, item: PagoDto) =>
                            total +
                            (
                                item.mensaje
                                    ? item.mensaje
                                        .split('|')
                                        .filter((e: string) => e.trim().length > 0)
                                        .length
                                    : 0
                            ),
                        0
                    );
                    this.totalesPorMoneda = {};

                    data.content.forEach((item: PagoDto) => {

                        const moneda = item.moneda || 'N/A';

                        this.totalesPorMoneda[moneda] =
                            (this.totalesPorMoneda[moneda] || 0) +
                            Number(item.monto || 0);

                    });

                    this.monedas = Object.keys(this.totalesPorMoneda);

                    this.cdr.detectChanges();

                },

                error: (error: any) => {

                    console.error(
                        this.translate.instant(
                            'errorpage.errorLoading'
                        ),
                        error
                    );

                }

            });

    }

    obtenerErroresTooltip(row: any): string {

        if (!row.mensaje) {
            return this.translate.instant(
                'errorpage.noErrorsTooltip'
            );
        }

        return row.mensaje
            .split('|')
            .map((error: string) => {

                const codigo = error.trim();

                return `${codigo} - ${this.obtenerDescripcionError(codigo)}`;

            })
            .join('\n');

    }

    onPage(event: TablePageEvent): void {

        this.pageIndex = Math.floor(
            (event.first ?? 0) /
            (event.rows ?? this.pageSize)
        );

        this.pageSize =
            event.rows ?? this.pageSize;

        this.cargarErrores();

    }
    search = '';

    onGlobalFilter(value: string): void {

        console.log('Filtro remoto:', value);

        this.search = value;

        this.pageIndex = 0;

        console.log('voy a cargar errores');

        this.cargarErrores();

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

        console.log(
            'sortField:',
            this.sortField,
            'sortOrder:',
            this.sortOrder
        );

        this.cargarErrores();

    }

    private inicializarColumnas(): void {

        this.translate
            .get('errorpage.tableColumns')
            .subscribe(columns => {

                this.columns = [
                    {
                        field: 'id',
                        header: columns.folio,
                        sortable: true,
                        width: '80px'
                    },
                    {
                        field: 'bu',
                        header: columns.bu || 'BU',
                        sortable: true,
                        width: '85px'
                    },
                    {
                        field: 'fechaEnvio',
                        header: columns.sentDate || 'FECHA ENVIO',
                        sortable: true,
                        width: '120px'
                    },
                    {
                        field: 'codigoProveedor',
                        header: columns.provider,
                        sortable: true,
                        width: '100px'
                    },
                    {
                        field: 'rfcBeneficiario',
                        header: columns.rfc,
                        sortable: true,
                        width: '120px'
                    },
                    {
                        field: 'nombreBeneficiario',
                        header: columns.name,
                        sortable: true,
                        width: '120px',
                        truncateLength: 10,
                        tooltip: true
                    },
                    {
                        field: 'monto',
                        header: columns.amount,
                        sortable: true,
                        width: '120px'
                    },
                    {
                        field: 'moneda',
                        header: columns.currency,
                        sortable: true,
                        width: '90px'
                    },
                    {
                        field: 'referencia',
                        header: columns.reference,
                        sortable: true,
                        width: '120px',
                        styleClass: 'truncate-column',
                        truncateLength: 8,
                        tooltip: true
                    },
                    {
                        field: 'nombreArchivo',
                        header: columns.file,
                        sortable: true,
                        width: '120px',
                        truncateLength: 6,
                        tooltip: true
                    },
                    {
                        field: 'errores',
                        header: columns.errors,
                        sortable: false,
                        width: '200px',
                        styleClass: 'truncate-column',
                        truncateLength: 15,
                        tooltip: true
                    },
                    {
                        field: 'actions',
                        header: columns.actions,
                        type: 'actions',
                        width: '100px'
                    }
                ];

                console.log('COLUMNAS TRADUCIDAS', this.columns);

            });

    }

    loadErrorsMessages(): void {
        
        this.translate
                .get('errorMessages')
                .subscribe(messages => {

                    this.errorMessagesTraducidos = messages;

                    console.log(
                        'ERROR_MESSAGES',
                        this.errorMessagesTraducidos
                    );

                });


    }

    cargarCatalogos(): void {
        this.pagoService.getCatalogosTipoPago().subscribe((tipos: TipoPagoDto[]) => {
            this.tiposDePagoCatalogo = [
                { id: 0, dealType: '', descripcion: this.translate.instant('errorpage.all'), corpo: false, bu: null },
                ...tipos
            ];
        });
    }
}