import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { FormsModule } from '@angular/forms';
import { PagoService, PagoDto, Page, TipoPagoDto, ClasificarPagosRequest, ClasificarPagoItem } from '../../services/pago.service';
import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

export interface Pago {
  id: number;
  proveedor: string;
  rfc: string;
  nombre: string;
  monto: number;
  moneda: string;
  descripcion: string;
  archivo: string;
  archivo_envio: string;
  estatus: string;
  tipo: string;
}

@Component({
  selector: 'app-pagos-enviados',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatInputModule,
    MatSnackBarModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './pagos-enviados.html',
  styleUrl: './pagos-enviados.scss',
})
export class PagosEnviadosComponent implements OnInit {
  displayedColumns: string[] = ['id', 'proveedor', 'rfc', 'nombre', 'monto', 'moneda', 'descripcion', 'archivo', 'archivo_envio', 'tipo', 'estatus'];
  tiposDePagoCatalogo: TipoPagoDto[] = [];
  selectedTipo: string | number = '';

  codigoProveedorFiltro: string = '';
  rfcBeneficiarioFiltro: string = '';

  totalElements: number = 0;
  pageSize: number = 10;
  pageIndex: number = 0;

  dataSource = new MatTableDataSource<Pago>([]);
  originalData: Pago[] = [];
  selection = new SelectionModel<Pago>(true, []);

  pagosValidados: boolean = false;

  constructor(
    private readonly pagoService: PagoService,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef,
    private readonly translate: TranslateService
  ) {}

  ngOnInit() {
    this.selectedTipo = this.translate.instant('sentpage.all');
    this.cargarCatalogos();
    this.cargarPagos();
    this.validarPagosStatus();
  }

  cargarCatalogos() {
    this.pagoService.getCatalogosTipoPago().subscribe({
      next: (data) => {
        this.tiposDePagoCatalogo = data;
      },
      error: (error) => {
        console.error('Error al cargar catálogos', error);
      }
    });
  }

  cargarPagos() {
    this.pagoService.getPagosEnviadosFiltro(this.codigoProveedorFiltro, this.rfcBeneficiarioFiltro, undefined, undefined, this.pageIndex, this.pageSize).subscribe({
      next: (data: Page<PagoDto>) => {
        this.originalData = data.content.map(item => ({
          id: item.id,
          proveedor: item.codigoProveedor || '',
          rfc:item.rfcBeneficiario || '',
          nombre: item.nombreBeneficiario || '',
          monto: Number(item.monto) || 0,
          moneda: item.moneda || '',
          descripcion: item.referencia || '',
          archivo: item.nombreArchivo || '',
          archivo_envio: item.nombreArchivoEnvio || '',
          estatus: item.estatus || '',
          tipo: item.tipoPago || ''
        }));
        this.totalElements = data.totalElements;
        this.aplicarFiltroTipo();
      },
      error: (error) => {
        console.error('Error al cargar pagos pendientes', error);
      }
    });
  }

  aplicarFiltroTipo() {
    if (
    this.selectedTipo ===
    this.translate.instant('sentpage.all')
  ) {
      this.dataSource.data = [...this.originalData];
    } else {
      this.dataSource.data = this.originalData.filter(p => p.tipo === this.selectedTipo);
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarPagos();
  }

  buscarPorFiltros() {
    this.pageIndex = 0;
    this.cargarPagos();
  }

  limpiarFiltros() {
    this.codigoProveedorFiltro = '';
    this.rfcBeneficiarioFiltro = '';
    this.selectedTipo = this.translate.instant('sentpage.all');
    this.pageIndex = 0;
    this.cargarPagos();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.dataSource.data.forEach(row => this.selection.select(row));
  }

  guardar() {
    const items: ClasificarPagoItem[] = this.selection.selected.map(p => ({
      id: p.id,
      dealType:
            this.selectedTipo !== this.translate.instant('sentpage.all')
                ? (this.selectedTipo as string)
                : p.tipo,
      decisionDuplicado: (p as any).decisionDuplicado
    }));

    const request: ClasificarPagosRequest = { items };

    this.pagoService.clasificarPagos(request).subscribe({
      next: (response) => {
        console.log('Clasificación guardada con éxito:', response);
        this.snackBar.open(
            this.translate.instant(
                'sentpage.saveSuccess'
            ),
            this.translate.instant(
                'sentpage.close'
            ),
            {
                duration: 3000,
                panelClass: ['success-snackbar']
            }
        );

        this.selection.clear();
        this.selectedTipo = this.translate.instant('sentpage.all');
        this.pagosValidados = false;
        this.validarPagosStatus();
        this.cargarPagos();

      },
      error: (error) => {
        console.error('Error al clasificar los pagos:', error);
        const errorMessage =
          error.error?.message ||
          this.translate.instant(
              'sentpage.saveError'
          );
        this.snackBar.open(
            errorMessage,
            this.translate.instant(
                'sentpage.close'
            ),
            {
                duration: 5000,
                panelClass: ['error-snackbar']
            }
        );
      }
    });
  }

  enviarPagos() {
    this.pagoService.enviarPagos().subscribe({
      next: (response) => {
        console.log('Envío de pagos exitoso:', response);
        this.snackBar.open(
            this.translate.instant(
                'sentpage.sendSuccess'
            ),
            this.translate.instant(
                'sentpage.close'
            ),
            {
                duration: 3000,
                panelClass: ['success-snackbar']
            }
        );
        this.selection.clear();
        this.selectedTipo = this.translate.instant('sentpage.all');
        this.pagosValidados = false;
        this.cargarPagos();
      },
      error: (error) => {
        console.error('Error al enviar los pagos:', error);
        const errorMessage =
          error.error?.message ||
          this.translate.instant(
              'sentpage.sendError'
          );
        this.snackBar.open(
            errorMessage,
            this.translate.instant(
                'sentpage.close'
            ),
            {
                duration: 5000,
                panelClass: ['error-snackbar']
            }
        );
      }
    });
  }

  validarPagosStatus() {
    this.pagoService.validarPagos().subscribe({
      next: (response) => {
        const valor = response ? response.trim() : '';

        if (valor === '1') {
          this.pagosValidados = true;
        } else {
          this.pagosValidados = false;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al validar el estado de los pagos silenciosamente:', error);
        this.pagosValidados = false;
        const errorMessage =
          error.error?.message ||
          this.translate.instant(
              'sentpage.validationError'
          );
        this.snackBar.open(
          errorMessage,
          this.translate.instant(
              'sentpage.close'
          ),
          {
              duration: 5000,
              panelClass: ['error-snackbar']
          }
      );
        this.cdr.detectChanges();
      }
    });
  }

  onTipoChange(event: MatSelectChange) {
    this.selectedTipo = event.value;
    // this.aplicarFiltroTipo();
  }

  aplicarMasa() {
    this.selection.selected.forEach(p => {
      if (
          this.selectedTipo !==
          this.translate.instant('sentpage.all')
      ) {
        p.tipo = this.selectedTipo as string;
      }
      // p.estatus = 'Aplicado';
    });
    this.selection.clear();
    this.selectedTipo = this.translate.instant('sentpage.all');
  }
}
