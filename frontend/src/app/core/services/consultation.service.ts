import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Consultation, CreateConsultationRequest, DashboardStatistics } from '../../models/consultation.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private http = inject(HttpClient);

  getAll(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${environment.apiUrl}/consultations`);
  }

  create(request: CreateConsultationRequest): Observable<Consultation> {
    return this.http.post<Consultation>(`${environment.apiUrl}/consultations`, request);
  }

  cancel(id: number, patientName: string): Observable<Consultation> {
    return this.http.patch<Consultation>(
      `${environment.apiUrl}/consultations/${id}/cancel?patientName=${encodeURIComponent(patientName)}`,
      {}
    );
  }

  getStatistics(): Observable<DashboardStatistics> {
    return this.http.get<DashboardStatistics>(`${environment.apiUrl}/consultations/statistics`);
  }
}
