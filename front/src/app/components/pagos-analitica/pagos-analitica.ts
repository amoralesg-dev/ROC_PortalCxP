import { ChangeDetectorRef, Component, OnInit, DestroyRef, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import {
  PageHeaderComponent,
  PageToolbarComponent,
  PageContentComponent
} from 'rassini-ui';
import { AnaliticaPendientesArchivoDTO } from '../../models/nalitica-pendientes.model';
import { PagoService } from '../../services/pago.service';
import { TreeNode } from 'primeng/api';
import { TreeTableModule } from 'primeng/treetable';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AuthService, BuDto } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-pagos-analitica',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    PageToolbarComponent,
    PageContentComponent,
    TranslatePipe,
    TreeTableModule,
    CurrencyPipe,
    FormsModule,
    SelectModule
  ],
  templateUrl: './pagos-analitica.html',
  styleUrl: './pagos-analitica.scss',
})
export class PagosAnaliticaComponent implements OnInit {


  analitica: AnaliticaPendientesArchivoDTO[] = [];

  filtroArchivo = '';

  private analiticaOriginal:AnaliticaPendientesArchivoDTO[] = [];

  loading = false;

  treeNodes: TreeNode[] = [];

  totalArchivos = 0;
  totalPagos = 0;
  totalMXN = 0;
  totalUSD = 0;
  totalEUR = 0;
  totalJPY = 0;

  buFiltro = '';
  busDisponibles: BuDto[] = [];

  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  constructor(
    private readonly pagoService: PagoService,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    const usuario = sessionStorage.getItem('auth_usuario') || '';
    if (usuario) {
      this.authService.getUserBus(usuario).subscribe(bus => {
        this.busDisponibles = bus;
        if (bus.length === 1) {
          this.buFiltro = bus[0].codigo;
        } else if (bus.length > 0) {
          const primerEspecifica = bus.find(b => b.codigo !== 'ALL') || bus[0];
          this.buFiltro = primerEspecifica.codigo;
        }
        this.cargarAnalitica();
      });
    }
  }

  onBuChange(): void {
    this.cargarAnalitica();
  }

  cargarAnalitica(): void {

    this.loading = true;

    this.pagoService
      .obtenerAnaliticaPendientes(this.buFiltro)
      .subscribe({

        next: data => {

          this.analiticaOriginal = data;

          this.analitica = data;

          this.calcularKpis(data);

          this.totalArchivos = data.length;

          this.totalPagos = data.reduce(
            (sum, item) => sum + item.cantidadPagos,
            0
          );

          this.construirTreeNodes(data);

          this.loading = false;

          this.cdr.detectChanges();

        },

        error: error => {

          console.error(
            'Error analitica',
            error
          );

          this.loading = false;

          this.cdr.detectChanges();

        }

      });

  }
  

  aplicarFiltro(): void {

    const filtro = this.filtroArchivo
      .toLowerCase()
      .trim();

    const datosFiltrados =
      !filtro
        ? this.analiticaOriginal
        : this.analiticaOriginal.filter(
            item =>
              item.nombreArchivo
                .toLowerCase()
                .includes(filtro)
          );

    this.calcularKpis(datosFiltrados);

    this.construirTreeNodes(
      datosFiltrados
    );

  }
  private construirTreeNodes(data: AnaliticaPendientesArchivoDTO[]): void {

    this.treeNodes = data.map(archivo => ({

      expanded: false,

      data: {
        nombre: archivo.nombreArchivo,
        nivel: 'analyticspage.file',
        cantidadPagos: archivo.cantidadPagos,
        montoTotal: archivo.montoTotal
      },

      children: archivo.empresas.map(empresa => ({

        expanded: false,

        data: {
          nombre: empresa.empresa,
          nivel: 'analyticspage.company',
          cantidadPagos: empresa.cantidadPagos,
          montoTotal: empresa.montoTotal
        },

        children: empresa.tiposPago.flatMap(tipo =>

          tipo.monedas.map(moneda => ({

            expanded: false,

            data: {
              nombre: moneda.moneda,
              nivel: 'analyticspage.currency',
              cantidadPagos: moneda.cantidadPagos,
              montoTotal: moneda.montoTotal
            },

            children: [
              {
                expanded: false,

                data: {
                  nombre: tipo.tipoPago,
                  nivel: 'analyticspage.paymentType',
                  cantidadPagos: tipo.cantidadPagos,
                  montoTotal: tipo.montoTotal
                }
              }
            ]

          }))

        )

      }))

    }));

  }

  private calcularKpis(data: AnaliticaPendientesArchivoDTO[]): void {

    this.totalArchivos = data.length;

    this.totalPagos = data.reduce(
      (sum, item) => sum + item.cantidadPagos,
      0
    );

    this.totalMXN = 0;
    this.totalUSD = 0;
    this.totalEUR = 0;
    this.totalJPY = 0;

    data.forEach(archivo => {

      archivo.empresas.forEach(empresa => {

        empresa.tiposPago.forEach(tipo => {

          tipo.monedas.forEach(moneda => {

            switch (moneda.moneda?.toUpperCase()) {

              case 'MXN':
                this.totalMXN += moneda.montoTotal;
                break;

              case 'USD':
                this.totalUSD += moneda.montoTotal;
                break;

              case 'EUR':
                this.totalEUR += moneda.montoTotal;
                break;

              case 'JPY':
              case 'YEN':
                this.totalJPY += moneda.montoTotal;
                break;

            }

          });

        });

      });

    });

  }

}