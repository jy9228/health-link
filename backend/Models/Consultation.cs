namespace HealthLink.Api.Models;

public class Consultation
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorSpecialty { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public ConsultationType ConsultationType { get; set; }
    public DateTime PreferredTime { get; set; }
    public string ReasonForVisit { get; set; } = string.Empty;
    public ConsultationStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
