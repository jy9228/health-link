import { Component, inject, signal, computed, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DoctorCard } from './doctor-card';
import { DoctorService } from '../../core/services/doctor.service';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [DoctorCard, FormsModule],
  templateUrl: './doctor-list.html',
  styleUrl: './doctor-list.scss',
})
export class DoctorList implements OnInit {
  private doctorService = inject(DoctorService);

  allDoctors = signal<Doctor[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  specialtyFilter = signal('All');
  bookDoctor = output<Doctor>();

  specialties = computed(() => {
    const specs = new Set(this.allDoctors().map(d => d.specialty));
    return ['All', ...specs];
  });

  doctors = computed(() => {
    let list = this.allDoctors();
    const search = this.searchTerm().toLowerCase().trim();
    const specialty = this.specialtyFilter();

    if (search) {
      list = list.filter(d =>
        d.name.toLowerCase().includes(search) ||
        d.specialty.toLowerCase().includes(search)
      );
    }

    if (specialty !== 'All') {
      list = list.filter(d => d.specialty === specialty);
    }

    return list;
  });

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    this.doctorService.getAll().subscribe({
      next: (doctors) => {
        this.allDoctors.set(doctors);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
  }

  onSpecialtyChange(value: string) {
    this.specialtyFilter.set(value);
  }

  onBookConsultation(doctor: Doctor) {
    this.bookDoctor.emit(doctor);
  }
}
