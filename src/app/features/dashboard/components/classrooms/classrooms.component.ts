import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SensorService } from '../../../../core/services/sensor';
import { TicketService } from '../../../../core/services/ticket.service';
import { SensorStatus } from '../../../../core/models/sensor-status.model';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-classrooms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classrooms.component.html',
  styleUrl: './classrooms.component.css'
})
export class ClassroomsComponent implements OnInit, OnDestroy {
  sensors: SensorStatus[] = [];
  groupedSensors: Record<string, SensorStatus[]> = {};
  
  totalCampuses = 0;
  totalClassrooms = 0;
  onlineCount = 0;
  offlineCount = 0;

  isReportingFault = false;
  selectedSensorForAnalytics: SensorStatus | null = null;
  isAnalyticsModalOpen = false;

  private pollingSubscription?: Subscription;

  constructor(
    private sensorService: SensorService,
    private ticketService: TicketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Polling every 5 seconds
    this.pollingSubscription = timer(0, 5000).pipe(
      switchMap(() => this.sensorService.getClientSensorStatus())
    ).subscribe({
      next: (data: SensorStatus[]) => {
        this.sensors = data;
        this.processData();
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error fetching sensor status', err)
    });
  }

  processData(): void {
    this.groupedSensors = {};
    this.onlineCount = 0;
    this.offlineCount = 0;
    this.totalClassrooms = this.sensors.length;

    for (const sensor of this.sensors) {
      if (sensor.isOnline) {
        this.onlineCount++;
      } else {
        this.offlineCount++;
      }

      const campusName = sensor.campus || 'Sede Principal';
      if (!this.groupedSensors[campusName]) {
        this.groupedSensors[campusName] = [];
      }
      this.groupedSensors[campusName].push(sensor);
    }
    this.totalCampuses = Object.keys(this.groupedSensors).length;
  }

  getAirQualityStatus(co2: number | null): { text: string, color: string } {
    if (co2 === null) return { text: 'Sin Datos', color: '#888' };
    if (co2 < 800) return { text: 'Óptima', color: '#10b981' }; // Green
    if (co2 < 1200) return { text: 'Regular', color: '#f59e0b' }; // Yellow
    return { text: 'Peligro', color: '#ef4444' }; // Red
  }

  reportFault(sensor: SensorStatus): void {
    if (confirm(`¿Estás seguro de reportar una falla para el sensor ${sensor.serialNumber} en el aula ${sensor.location}?`)) {
      this.isReportingFault = true;
      this.ticketService.createTicket({
        category: 'HARDWARE_FAULT',
        issueDescription: `Falla detectada en el sensor ${sensor.serialNumber} (Ubicación: ${sensor.location}, Sede: ${sensor.campus}). El sensor aparece como desconectado o presenta anomalías.`
      }).subscribe({
        next: () => {
          this.isReportingFault = false;
          alert('Falla reportada exitosamente. Se ha creado un ticket de soporte.');
        },
        error: (err) => {
          this.isReportingFault = false;
          alert('Hubo un error al crear el ticket. Intente de nuevo.');
          console.error(err);
        }
      });
    }
  }

  openAnalytics(sensor: SensorStatus): void {
    this.selectedSensorForAnalytics = sensor;
    this.isAnalyticsModalOpen = true;
  }

  closeAnalytics(): void {
    this.isAnalyticsModalOpen = false;
    this.selectedSensorForAnalytics = null;
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }
}
