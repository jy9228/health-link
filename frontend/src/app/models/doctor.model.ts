export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  avatarUrl: string;
  isAvailable: boolean;
  nextAvailableTime: string | null;
}
