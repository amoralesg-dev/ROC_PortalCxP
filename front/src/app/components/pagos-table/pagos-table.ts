import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { FormsModule } from '@angular/forms';
import { PagoService, PagoDto } from '../../services/pago.service';

export interface Pago {
  id: number;
  proveedor: string;
  nombre: string;
  monto: number;
  moneda: string;
  descripcion: string;
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
    FormsModule
  ],
  templateUrl: './pagos-table.html',
  styleUrl: './pagos-table.scss',
})
export class PagosTable implements OnInit {
  displayedColumns: string[] = ['select', 'id', 'proveedor', 'nombre', 'monto', 'moneda', 'descripcion', 'tipo', 'estatus'];
  tiposDePago: string[] = ['Todos', 'Nómina', 'Proveedores', 'Servicios', 'Impuestos', 'Otros'];
  tiposEditables: string[] = ['Nómina', 'Proveedores', 'Servicios', 'Impuestos', 'Otros'];
  selectedTipo: string = 'Todos';

  dataSource = new MatTableDataSource<Pago>([]);
  originalData: Pago[] = [];
  selection = new SelectionModel<Pago>(true, []);

  constructor(private pagoService: PagoService) {}

  ngOnInit() {
    this.cargarPagos();
  }

  cargarPagos() {
    this.pagoService.getPagosPendientesFiltro().subscribe({
      next: (data: PagoDto[]) => {
        this.originalData = data.map(item => ({
          id: item.id,
          proveedor: item.codigoProveedor || '',
          nombre: item.nombreBeneficiario || '',
          monto: Number(item.monto) || 0,
          moneda: item.moneda || '',
          descripcion: item.referencia || '',
          estatus: 'Pendiente',
          tipo: ''
        }));
        this.dataSource.data = [...this.originalData];
      },
      error: (error) => {
        console.error('Error al cargar pagos pendientes', error);
      }
    });
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
    console.log('Guardando datos', this.dataSource.data);
  }

  enviarPagos() {
    console.log('Enviando pagos', this.selection.selected);
  }

  onTipoChange(event: MatSelectChange) {
    this.selectedTipo = event.value;
    if (this.selectedTipo === 'Todos') {
      this.dataSource.data = [...this.originalData];
    } else {
      this.dataSource.data = this.originalData.filter(p => p.tipo === this.selectedTipo);
    }
  }
}
