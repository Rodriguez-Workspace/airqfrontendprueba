import { Injectable, inject }
  from '@angular/core';

import { HttpClient }
  from '@angular/common/http';

import { Observable }
  from 'rxjs';

import { Measurement }
  from '../models/measurement.model';

@Injectable({
  providedIn: 'root'
})
export class MeasurementService {

  private http =
    inject(HttpClient);

  private api =
    'http://localhost:8080/api/v1/measurements';

  getMeasurements(): Observable<Measurement[]> {

    return this.http.get<Measurement[]>(
      this.api
    );
  }

  getBySensor(
    sensorId: number
  ): Observable<Measurement[]> {

    return this.http.get<Measurement[]>(
      `${this.api}/sensor/${sensorId}`
    );
  }

  createMeasurement(
    measurement: {
      sensorId: number;
      co2: number;
      pm25: number;
      temperature: number;
      humidity: number;
    }
  ): Observable<Measurement> {

    return this.http.post<Measurement>(
      this.api,
      measurement
    );
  }
}