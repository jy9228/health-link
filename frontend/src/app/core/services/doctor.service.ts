import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Doctor } from '../../models/doctor.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private http = inject(HttpClient);

  getAll(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${environment.apiUrl}/doctors`);
  }

  getBookedSlots(doctorId: number, date: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/doctors/${doctorId}/booked-slots?date=${date}`);
  }
}
