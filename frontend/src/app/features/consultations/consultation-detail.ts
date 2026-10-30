import { Component, input, output, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Consultation } from '../../models/consultation.model';
import { ConsultationService } from '../../core/services/consultation.service';

@Component({
  selector: 'app-consultation-detail',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './consultation-detail.html',
  styleUrl: './consultation-detail.scss',
})
export class ConsultationDetail {
  private consultationService = inject(ConsultationService);

  consultation = input.required<Consultation>();
  isOpen = input.required<boolean>();
  closeDetail = output<void>();
  cancelled = output<void>();

  cancelling = signal(false);
  showConfirm = signal(false);
  errorMessage = signal('');

  get typeLabel(): string {
    return this.consultation().consultationType === 'VideoCall' ? 'Video Call' : 'Chat';
  }

  onClose() {
    this.showConfirm.set(false);
    this.errorMessage.set('');
    this.closeDetail.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('detail-overlay')) {
      this.onClose();
    }
  }

  promptCancel() {
    this.showConfirm.set(true);
  }

  dismissCancel() {
    this.showConfirm.set(false);
  }

  confirmCancel() {
    this.cancelling.set(true);
    this.errorMessage.set('');

    this.consultationService.cancel(this.consultation().id, this.consultation().patientName).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.showConfirm.set(false);
        this.cancelled.emit();
        this.closeDetail.emit();
      },
      error: (err) => {
        this.cancelling.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to cancel consultation.');
      },
    });
  }
}
