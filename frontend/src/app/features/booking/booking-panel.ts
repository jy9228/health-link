import { Component, input, output, signal, inject, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Doctor } from '../../models/doctor.model';
import { ConsultationType } from '../../models/consultation.model';
import { ConsultationService } from '../../core/services/consultation.service';
import { DoctorService } from '../../core/services/doctor.service';

@Component({
  selector: 'app-booking-panel',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './booking-panel.html',
  styleUrl: './booking-panel.scss',
})
export class BookingPanel implements OnInit {
  private fb = inject(FormBuilder);
  private consultationService = inject(ConsultationService);
  private doctorService = inject(DoctorService);

  doctor = input.required<Doctor>();
  isOpen = input.required<boolean>();
  closePanel = output<void>();
  booked = output<void>();

  form!: FormGroup;
  submitting = signal(false);
  submitted = signal(false);
  errorMessage = signal('');
  selectedType = signal<ConsultationType>('Chat');
  selectedDate = signal('');
  selectedTime = signal('');
  bookedSlots = signal<Set<string>>(new Set());
  timeSlots: string[] = [];

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const doc = this.doctor();
      const date = this.selectedDate();
      if (open && doc && date) {
        this.loadBookedSlots(doc.id, date);
      }
    });
  }

  ngOnInit() {
    this.generateTimeSlots();
    const today = this.formatDate(new Date());
    this.selectedDate.set(today);

    this.form = this.fb.group({
      consultationType: ['Chat', Validators.required],
      preferredDate: [today, Validators.required],
      preferredTime: ['', Validators.required],
      reasonForVisit: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  get minDate(): string {
    return this.formatDate(new Date());
  }

  private generateTimeSlots() {
    const slots: string[] = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (const min of [0, 30]) {
        if (hour === 21 && min === 30) break;
        const date = new Date();
        date.setHours(hour, min, 0, 0);
        slots.push(date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
      }
    }
    this.timeSlots = slots;
  }

  private loadBookedSlots(doctorId: number, date: string) {
    this.doctorService.getBookedSlots(doctorId, date).subscribe({
      next: (slots) => {
        const set = new Set<string>();
        for (const isoStr of slots) {
          const d = new Date(isoStr);
          set.add(d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
        }
        this.bookedSlots.set(set);
      },
      error: () => this.bookedSlots.set(new Set()),
    });
  }

  isSlotDisabled(slot: string): boolean {
    if (this.bookedSlots().has(slot)) return true;

    const dateStr = this.selectedDate();
    if (!dateStr) return false;
    const today = this.formatDate(new Date());
    if (dateStr !== today) return false;

    const now = new Date();
    const slotDate = this.parseSlotToDate(slot, dateStr);
    return slotDate <= now;
  }

  isSlotBooked(slot: string): boolean {
    return this.bookedSlots().has(slot);
  }

  private parseSlotToDate(slot: string, dateStr: string): Date {
    const [time, period] = slot.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, hours, minutes, 0, 0);
  }

  selectType(type: ConsultationType) {
    this.selectedType.set(type);
    this.form.patchValue({ consultationType: type });
  }

  onDateChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.selectedDate.set(value);
    this.selectedTime.set('');
    this.form.patchValue({ preferredDate: value, preferredTime: '' });
  }

  selectTime(slot: string) {
    if (this.isSlotDisabled(slot)) return;
    this.selectedTime.set(slot);
    this.form.patchValue({ preferredTime: slot });
  }

  get reasonLength(): number {
    return this.form?.get('reasonForVisit')?.value?.length || 0;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const dateStr = this.form.value.preferredDate;
    const timeStr = this.form.value.preferredTime;
    const preferredTime = this.parseSlotToDate(timeStr, dateStr).toISOString();

    const idempotencyKey = crypto.randomUUID();

    this.consultationService.create({
      doctorId: this.doctor().id,
      patientName: 'John',
      consultationType: this.form.value.consultationType,
      preferredTime,
      reasonForVisit: this.form.value.reasonForVisit,
      idempotencyKey,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
        setTimeout(() => {
          this.submitted.set(false);
          this.resetForm();
          this.booked.emit();
          this.closePanel.emit();
        }, 1500);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to create booking. Please try again.');
      },
    });
  }

  private resetForm() {
    const today = this.formatDate(new Date());
    this.form.reset({ consultationType: 'Chat', preferredDate: today, preferredTime: '', reasonForVisit: '' });
    this.selectedType.set('Chat');
    this.selectedDate.set(today);
    this.selectedTime.set('');
    this.errorMessage.set('');
  }

  onClose() {
    this.closePanel.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('booking-overlay')) {
      this.onClose();
    }
  }
}
