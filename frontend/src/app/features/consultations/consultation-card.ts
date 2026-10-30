import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Consultation } from '../../models/consultation.model';

@Component({
  selector: 'app-consultation-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './consultation-card.html',
  styleUrl: './consultation-card.scss',
})
export class ConsultationCard {
  consultation = input.required<Consultation>();
  viewDetails = output<Consultation>();

  get typeLabel(): string {
    return this.consultation().consultationType === 'VideoCall' ? 'Video Call' : 'Chat';
  }

  onClick() {
    this.viewDetails.emit(this.consultation());
  }
}
