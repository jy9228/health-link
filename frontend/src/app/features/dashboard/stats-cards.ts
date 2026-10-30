import { Component, inject, signal, OnInit } from '@angular/core';
import { ConsultationService } from '../../core/services/consultation.service';
import { DashboardStatistics } from '../../models/consultation.model';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  templateUrl: './stats-cards.html',
  styleUrl: './stats-cards.scss',
})
export class StatsCards implements OnInit {
  private consultationService = inject(ConsultationService);

  stats = signal<DashboardStatistics | null>(null);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.consultationService.getStatistics().subscribe({
      next: (data) => this.stats.set(data),
    });
  }
}
