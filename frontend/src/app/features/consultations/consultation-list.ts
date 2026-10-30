import { Component, inject, signal, computed, OnInit, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsultationCard } from './consultation-card';
import { ConsultationService } from '../../core/services/consultation.service';
import { Consultation, ConsultationStatus } from '../../models/consultation.model';

@Component({
  selector: 'app-consultation-list',
  standalone: true,
  imports: [ConsultationCard, FormsModule],
  templateUrl: './consultation-list.html',
  styleUrl: './consultation-list.scss',
})
export class ConsultationList implements OnInit {
  private consultationService = inject(ConsultationService);

  allConsultations = signal<Consultation[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  statusFilter = signal<ConsultationStatus | 'All'>('All');
  sortOrder = signal<'desc' | 'asc'>('desc');
  viewConsultation = output<Consultation>();

  consultations = computed(() => {
    let list = this.allConsultations();
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    const order = this.sortOrder();

    if (search) {
      list = list.filter(c => c.doctorName.toLowerCase().includes(search));
    }

    if (status !== 'All') {
      list = list.filter(c => c.status === status);
    }

    list = [...list].sort((a, b) => {
      const timeA = new Date(a.preferredTime).getTime();
      const timeB = new Date(b.preferredTime).getTime();
      return order === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return list;
  });

  ngOnInit() {
    this.loadConsultations();
  }

  loadConsultations() {
    this.loading.set(true);
    this.consultationService.getAll().subscribe({
      next: (data) => {
        this.allConsultations.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
  }

  onStatusChange(value: string) {
    this.statusFilter.set(value as ConsultationStatus | 'All');
  }

  toggleSortOrder() {
    this.sortOrder.update(current => current === 'desc' ? 'asc' : 'desc');
  }

  onViewDetails(consultation: Consultation) {
    this.viewConsultation.emit(consultation);
  }
}
