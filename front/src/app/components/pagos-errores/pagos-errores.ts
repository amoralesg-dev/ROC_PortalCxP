import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import {
  PagoService,
  PagoDto,
  Page
} from '../../services/pago.service';
import { ChangeDetectorRef } from '@angular/core';
import { ERROR_MESSAGES } from '../../constants/error-messages';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { TablePageEvent } from 'primeng/table';
import { TableLazyLoadEvent } from 'primeng/table';

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
    PageHeaderComponent,
    PageToolbarComponent,
    PageContentComponent,
    DataTable,
    AppDialog,
    ButtonModule,
    TooltipModule,
    TranslatePipe
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


    //reports
    totalRegistros = 0;
    totalArchivos = 0;
    totalEstatusError = 0;
    totalErrores = 0;
    

    
    ngOnInit(): void {

        

        this.inicializarColumnas();

        this.loadErrorsMessages();

        this.cargarErrores();

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

        this.pagoService
            .getPagosErroresFiltro(
                this.search,
                this.pageIndex,
                this.pageSize,
                this.sortField,
                this.sortOrder === 1 ? 'ASC' : 'DESC'
            ).subscribe({

                next: (data: Page<PagoDto>) => {
                    this.totalElements = data.totalElements;

                    this.errores = data.content.map(item => ({

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
                        data.content.map(item => item.nombreArchivo)
                    ).size;

                    this.totalEstatusError = data.totalElements;

                    this.totalErrores = data.content.reduce(
                        (total, item) =>
                            total +
                            (
                                item.mensaje
                                    ? item.mensaje
                                        .split('|')
                                        .filter(e => e.trim().length > 0)
                                        .length
                                    : 0
                            ),
                        0
                    );

                    this.cdr.detectChanges();

                },

                error: (error) => {

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
                        sortable: true
                    },
                    {
                        field: 'codigoProveedor',
                        header: columns.provider,
                        sortable: true
                    },
                    {
                        field: 'rfcBeneficiario',
                        header: columns.rfc,
                        sortable: true
                    },
                    {
                        field: 'nombreBeneficiario',
                        header: columns.name,
                        sortable: true
                    },
                    {
                        field: 'monto',
                        header: columns.amount,
                        sortable: true
                    },
                    {
                        field: 'moneda',
                        header: columns.currency,
                        sortable: true
                    },
                    {
                        field: 'referencia',
                        header: columns.reference,
                        sortable: true
                    },
                    {
                        field: 'nombreArchivo',
                        header: columns.file,
                        sortable: true
                    },
                    {
                        field: 'errores',
                        header: columns.errors,
                        sortable: false
                    },
                    {
                        field: 'actions',
                        header: columns.actions,
                        type: 'actions'
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

}