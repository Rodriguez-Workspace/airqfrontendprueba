import { Injectable, inject }
  from '@angular/core';

import {
  HttpClient
}
  from '@angular/common/http';

import { MeasurementService }
  from '../../core/services/measurement';

import { Measurement }
  from '../../core/models/measurement.model';

import {
  Observable
}
  from 'rxjs';

import {
  Sensor
}
  from '../models/sensor.model';

import {
  AverageMetrics
}
  from '../models/average-metrics.model';

import { SensorStatus } from '../models/sensor-status.model';

@Injectable({
  providedIn: 'root'
})
export class SensorService {

  private http =
    inject(HttpClient);

  private measurementService =
    inject(MeasurementService);

  expandedSensorId?: number;

  measurementsMap:
    Record<number, Measurement[]> = {};

  private adminApi =
    'http://localhost:8080/api/v1/admin/sensors';

  private clientApi =
    'http://localhost:8080/api/v1/client/sensors';

  getSensors(): Observable<Sensor[]> {

    return this.http.get<Sensor[]>(
      this.adminApi
    );
  }

  getSensorById(id: number): Observable<Sensor> {
    return this.http.get<Sensor>(`${this.adminApi}/${id}`);
  }

  createSensor(
    sensor: Sensor
  ): Observable<Sensor> {

    return this.http.post<Sensor>(
      this.adminApi,
      sensor
    );
  }

  updateSensor(
    id: number,
    sensor: Sensor
  ): Observable<Sensor> {

    return this.http.put<Sensor>(
      `${this.adminApi}/${id}`,
      sensor
    );

  }

  deleteSensor(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.adminApi}/${id}`
    );

  }

  getClientSensors(): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(this.clientApi);
  }

  getAverageMetrics(): Observable<AverageMetrics> {
    return this.http.get<AverageMetrics>(`${this.clientApi}/metrics/average`);
  }

  getHistoricalMetrics(): Observable<import('../models/hourly-metric.model').HourlyMetric[]> {
    return this.http.get<import('../models/hourly-metric.model').HourlyMetric[]>(`${this.clientApi}/metrics/historical`);
  }

  getClientSensorStatus(): Observable<SensorStatus[]> {
    return this.http.get<SensorStatus[]>(`${this.clientApi}/status`);
  }
}