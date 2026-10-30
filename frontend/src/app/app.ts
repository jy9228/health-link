import { Component, signal, ViewChild } from '@angular/core';
import { Header } from './layout/header';
import { HeroBanner } from './layout/hero-banner';
import { StatsCards } from './features/dashboard/stats-cards';
import { DoctorList } from './features/doctor-list/doctor-list';
import { ConsultationList } from './features/consultations/consultation-list';
import { ConsultationDetail } from './features/consultations/consultation-detail';
import { BookingPanel } from './features/booking/booking-panel';
import { Doctor } from './models/doctor.model';
import { Consultation } from './models/consultation.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Header, HeroBanner, StatsCards, DoctorList, ConsultationList, ConsultationDetail, BookingPanel],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  selectedDoctor = signal<Doctor | null>(null);
  isPanelOpen = signal(false);
  selectedConsultation = signal<Consultation | null>(null);
  isDetailOpen = signal(false);

  @ViewChild(ConsultationList) consultationList!: ConsultationList;
  @ViewChild(StatsCards) statsCards!: StatsCards;
  @ViewChild(DoctorList) doctorList!: DoctorList;

  onBookDoctor(doctor: Doctor) {
    this.selectedDoctor.set(doctor);
    this.isPanelOpen.set(true);
  }

  onClosePanel() {
    this.isPanelOpen.set(false);
  }

  onBooked() {
    this.consultationList.loadConsultations();
    this.statsCards.loadStats();
    this.doctorList.loadDoctors();
  }

  onViewConsultation(consultation: Consultation) {
    this.selectedConsultation.set(consultation);
    this.isDetailOpen.set(true);
  }

  onCloseDetail() {
    this.isDetailOpen.set(false);
  }

  onCancelled() {
    this.consultationList.loadConsultations();
    this.statsCards.loadStats();
    this.doctorList.loadDoctors();
  }
}
