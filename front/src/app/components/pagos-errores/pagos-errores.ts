import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import {
  PagoService,
  PagoDto,
  Page
} from '../../services/pago.service';
import { ChangeDetectorRef } from '@angular/core';
import { ERROR_MESSAGES } from '../../constants/error-messages';
import { PAGOS_ERRORES_COLUMNS } from '../../constants/pagos-errores-columns';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { TablePageEvent } from 'primeng/table';

import {
  PageHeaderComponent,
  PageToolbarComponent,
  PageContentComponent,
  DataTable,
  AppDialog,
  Toast
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
    TooltipModule
  ],
  templateUrl: './pagos-errores.html',
  styleUrl: './pagos-errores.scss'
})
export class PagosErroresComponent {

    pageIndex = 0;
    pageSize = 10;
    totalElements = 0;

    
    ngOnInit(): void {

        this.cargarErrores();

    }


    constructor(private pagoService: PagoService,
                private cdr: ChangeDetectorRef,
                private readonly confirmationService: ConfirmationService,
                private readonly toast: Toast) 
    {
    }

    readonly columns = PAGOS_ERRORES_COLUMNS;

    mostrarErroresDialog = false;

    erroresDetalle: string[] = [];

    errores: PagoDto[] = [];

    selectedRows: PagoDto[] = [];

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

        return this.mensajesError[codigo] ??
            codigo;

    }

    rechazarRegistro(row: PagoDto): void {

        this.confirmationService.confirm({

            header: 'Rechazar Registro',

            message: '¿Deseas rechazar este registro?',

            acceptLabel: 'Rechazar',

            rejectLabel: 'Cancelar',

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
                                'Registro rechazado correctamente'
                            );

                            this.cargarErrores();

                        },

                        error: () => {

                            this.toast.error(
                                'Error al rechazar registro'
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

            header: 'Rechazar Registros',

           message: `¿Deseas rechazar ${ids.length} registro(s)?`,

            acceptLabel: 'Rechazar',

            rejectLabel: 'Cancelar',

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
                                'Registros rechazados correctamente'
                            );

                            this.selectedRows = [];

                            this.cargarErrores();

                        },

                        error: () => {

                            this.toast.error(
                                'Error al rechazar registros'
                            );

                        }

                    });

            }

        });

    }

    cargarErrores(): void {

        this.pagoService
            .getPagosErroresFiltro(this.search,this.pageIndex,this.pageSize)
            .subscribe({

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

                    this.cdr.detectChanges();

                },

                error: (error) => {

                    console.error(
                        'Error al cargar errores',
                        error
                    );

                }

            });

    }

    obtenerErroresTooltip(row: any): string {

        if (!row.mensaje) {
            return 'Sin errores';
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

}