import { Component, OnInit } from '@angular/core';
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
import { SelectionModel } from '@angular/cdk/collections';
import { FormsModule } from '@angular/forms';
import { PagoService, PagoDto, Page, TipoPagoDto } from '../../services/pago.service';

export interface Pago {
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
}

@Component({
  selector: 'app-pagos-table',
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
    FormsModule
  ],
  templateUrl: './pagos-table.html',
  styleUrl: './pagos-table.scss',
})
export class PagosTable implements OnInit {
  displayedColumns: string[] = ['select', 'id', 'proveedor', 'rfc', 'nombre', 'monto', 'moneda', 'descripcion', 'archivo', 'tipo', 'estatus'];
  tiposDePagoCatalogo: TipoPagoDto[] = [];
  selectedTipo: string | number = 'Todos';

  codigoProveedorFiltro: string = '';
  rfcBeneficiarioFiltro: string = '';

  totalElements: number = 0;
  pageSize: number = 10;
  pageIndex: number = 0;

  dataSource = new MatTableDataSource<Pago>([]);
  originalData: Pago[] = [];
  selection = new SelectionModel<Pago>(true, []);

  constructor(private pagoService: PagoService) {}

  ngOnInit() {
    this.cargarCatalogos();
    this.cargarPagos();
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
    this.pagoService.getPagosPendientesFiltro(this.codigoProveedorFiltro, this.rfcBeneficiarioFiltro, this.pageIndex, this.pageSize).subscribe({
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
          estatus: 'Pendiente',
          tipo: ''
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
    if (this.selectedTipo === 'Todos') {
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
    this.selectedTipo = 'Todos';
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
    this.selection.selected.forEach(p => {
      if (this.selectedTipo !== 'Todos') {
        p.tipo = this.selectedTipo as string;
      }
      // p.estatus = 'Aplicado';
    });
    this.selection.clear();
    this.selectedTipo = 'Todos';
  }

  enviarPagos() {
    console.log('Enviando pagos', this.selection.selected);
  }

  onTipoChange(event: MatSelectChange) {
    this.selectedTipo = event.value;
    // this.aplicarFiltroTipo();
  }

  aplicarMasa() {
    this.selection.selected.forEach(p => {
      if (this.selectedTipo !== 'Todos') {
        p.tipo = this.selectedTipo as string;
      }
      // p.estatus = 'Aplicado';
    });
    this.selection.clear();
    this.selectedTipo = 'Todos';
  }
}
