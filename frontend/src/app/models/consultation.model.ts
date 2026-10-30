export type ConsultationType = 'Chat' | 'VideoCall';
export type ConsultationStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface Consultation {
  id: number;
  doctorId: number;
  doctorName: string;
  doctorSpecialty: string;
  patientName: string;
  consultationType: ConsultationType;
  preferredTime: string;
  reasonForVisit: string;
  status: ConsultationStatus;
  createdAt: string;
}

export interface CreateConsultationRequest {
  doctorId: number;
  patientName: string;
  consultationType: ConsultationType;
  preferredTime: string;
  reasonForVisit: string;
  idempotencyKey?: string;
}

export interface DashboardStatistics {
  totalAvailableDoctors: number;
  upcomingConsultations: number;
  completedConsultations: number;
}
