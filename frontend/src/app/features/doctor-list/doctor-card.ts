import { Component, input, output, signal } from '@angular/core';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-card',
  standalone: true,
  templateUrl: './doctor-card.html',
  styleUrl: './doctor-card.scss',
})
export class DoctorCard {
  doctor = input.required<Doctor>();
  bookConsultation = output<Doctor>();
  imageError = signal(false);

  get initials(): string {
    const name = this.doctor().name.replace(/^Dr\.\s*/i, '');
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }

  get availabilityText(): string {
    const doc = this.doctor();
    if (!doc.isAvailable) return 'Fully booked today';
    if (!doc.nextAvailableTime) return 'Available now';
    const next = new Date(doc.nextAvailableTime);
    const now = new Date();
    const diffMin = (next.getTime() - now.getTime()) / 60000;
    if (diffMin <= 30) return 'Available now';
    return `Available from ${next.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }

  get isBusy(): boolean {
    const doc = this.doctor();
    if (!doc.isAvailable || !doc.nextAvailableTime) return false;
    const diffMin = (new Date(doc.nextAvailableTime).getTime() - Date.now()) / 60000;
    return diffMin > 30;
  }

  onImageError() {
    this.imageError.set(true);
  }

  onBook() {
    this.bookConsultation.emit(this.doctor());
  }
}
