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

import {
  PageHeaderComponent,
  PageToolbarComponent,
  PageContentComponent,
  DataTable,
  DataTableColumn,
  AppConfirmDialog,
  AppDialog,
  Dialog,
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
    AppConfirmDialog,
    ButtonModule
  ],
  templateUrl: './pagos-errores.html',
  styleUrl: './pagos-errores.scss'
})
export class PagosErroresComponent {

    
    ngOnInit(): void {

        
 console.log('TOAST', this.toast);

    console.log('CONFIRMATION', this.confirmationService);

            this.cargarErrores();

    }


    constructor(private pagoService: PagoService,
                private cdr: ChangeDetectorRef,
                private readonly confirmationService: ConfirmationService,
                private readonly dialog: Dialog,
                private readonly toast: Toast) 
    {
    }

    readonly columns = PAGOS_ERRORES_COLUMNS;

    mostrarErroresDialog = false;

    erroresDetalle: string[] = [];

    errores: any[] = [];

    selectedRows: any[] = [];

    onSelectionChange(rows: any[]): void {
        this.selectedRows = rows;
    }

    verErrores(row: any): void {

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

    rechazarRegistro(row: any): void {

        this.confirmationService.confirm({

            header: 'Rechazar Registro',

            message: `¿Deseas rechazar el registro ${row.id}?`,

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
            .getPagosErroresFiltro()
            .subscribe({

                next: (data: Page<PagoDto>) => {
                    
                    this.errores = data.content;

                    this.cdr.detectChanges();

                    console.log(data);

                },

                error: (error) => {

                    console.error(
                        'Error al cargar errores',
                        error
                    );

                }

            });

    }

    
    


}