import {
  Component,
  OnInit
} from '@angular/core';

import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';

import {
  PagoService,
  PagoDto,
  Page
} from '../../services/pago.service';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import {
  TableLazyLoadEvent
} from 'primeng/table';

import {
  PageHeaderComponent,
  PageContentComponent,
  DataTable,
  DataTableColumn
} from 'rassini-ui';

import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-pagos-enviados',
  standalone: true,
  imports: [
    CommonModule,
    DatePickerModule,
    FormsModule,
    PageHeaderComponent,
    PageContentComponent,
    DataTable,
    ButtonModule,
    TranslatePipe
  ],
  templateUrl: './pagos-enviados.html',
  styleUrl: './pagos-enviados.scss'
})
export class PagosEnviadosComponent implements OnInit {

  columns: DataTableColumn[] = [];

  pagos: PagoDto[] = [];

  pageIndex = 0;

  pageSize = 10;

  totalElements = 0;

  search = '';

  fechaInicio: Date | null = null;

  fechaFin: Date | null = null;

  sortField = '';

  sortOrder = 1;

  private readonly sortFieldMap: Record<string, string> = {
    id: 'id',
    codigoProveedor: 'codigoProveedor',
    rfcBeneficiario: 'rfcBeneficiario',
    nombreBeneficiario: 'nombreBeneficiario',
    monto: 'monto',
    moneda: 'moneda',
    referencia: 'referencia',
    nombreArchivo: 'nombreArchivo',
    nombreArchivoEnvio: 'nombreArchivoEnvio',
    tipoPago: 'tipoPago',
    estatus: 'estatus'
  };

  constructor(
    private readonly pagoService: PagoService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.inicializarColumnas();

    this.cargarPagos();

  }

  private inicializarColumnas(): void {

    this.translate
      .get('sentpage')
      .subscribe(columns => {

        this.columns = [
          {
            field: 'id',
            header: columns.folio,
            sortable: true
          },
          {
            field: 'codigoProveedor',
            header: columns.supplier,
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
            header: columns.totalAmount,
            sortable: true
          },
          {
            field: 'moneda',
            header: columns.currency,
            sortable: true
          },
          {
            field: 'referencia',
            header: columns.description,
            sortable: true
          },
          {
            field: 'nombreArchivo',
            header: columns.file,
            sortable: true
          },
          {
            field: 'nombreArchivoEnvio',
            header: columns.sendFile,
            sortable: true
          },
          {
            field: 'tipoPago',
            header: columns.paymentType,
            sortable: true
          },
          {
            field: 'estatus',
            header: columns.status,
            sortable: true
          }
        ];

      });

  }

  cargarPagos(): void {

    console.log('fechaInicio', this.fechaInicio);
    console.log('fechaFin', this.fechaFin);

    const backendSortField =
        this.sortField
            ? this.sortFieldMap[this.sortField] ?? this.sortField
            : '';

    const sortDirection =
        this.sortOrder === 1
            ? 'ASC'
            : 'DESC';

    console.log(
        'SEARCH',
        this.search,
        'PAGE',
        this.pageIndex,
        'SIZE',
        this.pageSize,
        'SORT',
        backendSortField,
        sortDirection
    );

      this.pagoService
        .getPagosEnviadosFiltro(
            this.search,
            this.formatDate(this.fechaInicio),
            this.formatDate(this.fechaFin),     
            this.pageIndex,
            this.pageSize,
            backendSortField,
            sortDirection
        )
        .subscribe({

            next: (data: Page<PagoDto>) => {

                this.totalElements =
                    data.totalElements;

                this.pagos =
                    [...data.content];

                this.cdr.detectChanges();

            },

            error: (error) => {

                console.error(
                    'Error al cargar pagos enviados',
                    error
                );

            }

        });

  }

  onGlobalFilter(value: string): void {

    this.search = value;

    this.pageIndex = 0;

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

  onDateRangeChange(): void {

    console.log('CLICK BUSCAR');
    this.pageIndex = 0;

    this.cargarPagos();
  }

  private formatDate(
  date: Date | null
  ): string {

    if (!date) {
      return '';
    }

    const yyyy = date.getFullYear();

    const mm = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const dd = String(
      date.getDate()
    ).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }




}