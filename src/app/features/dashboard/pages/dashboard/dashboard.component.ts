import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SensorService } from '../../../../core/services/sensor';
import { AverageMetrics } from '../../../../core/models/average-metrics.model';
import { HourlyMetric } from '../../../../core/models/hourly-metric.model';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ClassroomsComponent } from '../../components/classrooms/classrooms.component';
import { ClientSettingsComponent } from '../../components/client-settings/client-settings.component';
import { AlertCenterComponent } from '../../components/alert-center/alert-center.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ClassroomsComponent, ClientSettingsComponent, AlertCenterComponent, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeView = 'dashboard';
  averageMetrics: AverageMetrics | null = null;
  private pollingSubscription?: Subscription;
  private historicalSubscription?: Subscription;

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.4
      }
    }
  };

  public chartDataTemp: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  public chartDataHum: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  public chartDataCo2: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  public chartDataPm25: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

  constructor(
    private router: Router,
    private sensorService: SensorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const path = this.router.url.split('/').filter(Boolean)[0] || 'dashboard';
    this.activeView = path;
    
    // Iniciar polling cada 5 segundos (5000 ms)
    this.pollingSubscription = timer(0, 5000).pipe(
      switchMap(() => this.sensorService.getAverageMetrics())
    ).subscribe({
      next: (metrics: AverageMetrics) => {
        this.averageMetrics = metrics;
        this.cdr.detectChanges(); // Forzar repintado UI
      },
      error: (err: any) => {
        console.error('Error al obtener métricas en tiempo real', err);
      }
    });

    this.loadHistoricalData();
  }

  loadHistoricalData(): void {
    this.historicalSubscription = this.sensorService.getHistoricalMetrics().subscribe({
      next: (historicalData: HourlyMetric[]) => {
        const labels = historicalData.map(d => d.hour);
        const dataTemp = historicalData.map(d => d.averageTemperature);
        const dataHum = historicalData.map(d => d.averageHumidity);
        const dataCo2 = historicalData.map(d => d.averageCo2);
        const dataPm25 = historicalData.map(d => d.averagePm25);

        this.chartDataTemp = {
          labels,
          datasets: [{ data: dataTemp, label: 'Temperatura (°C)', borderColor: '#ff6384', backgroundColor: 'rgba(255,99,132,0.2)', fill: true }]
        };
        this.chartDataHum = {
          labels,
          datasets: [{ data: dataHum, label: 'Humedad (%)', borderColor: '#36a2eb', backgroundColor: 'rgba(54,162,235,0.2)', fill: true }]
        };
        this.chartDataCo2 = {
          labels,
          datasets: [{ data: dataCo2, label: 'CO2 (ppm)', borderColor: '#ffce56', backgroundColor: 'rgba(255,206,86,0.2)', fill: true }]
        };
        this.chartDataPm25 = {
          labels,
          datasets: [{ data: dataPm25, label: 'PM2.5 (μg/m³)', borderColor: '#4bc0c0', backgroundColor: 'rgba(75,192,192,0.2)', fill: true }]
        };

        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al obtener métricas históricas', err);
      }
    });
  }

  ngOnDestroy(): void {
    // Detener el polling cuando el usuario sale de la pantalla
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    if (this.historicalSubscription) {
      this.historicalSubscription.unsubscribe();
    }
  }
}