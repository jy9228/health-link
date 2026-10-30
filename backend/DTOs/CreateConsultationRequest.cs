using System.ComponentModel.DataAnnotations;
using HealthLink.Api.Models;

namespace HealthLink.Api.DTOs;

public class CreateConsultationRequest
{
    [Required]
    public int DoctorId { get; set; }

    [Required]
    [StringLength(100)]
    public string PatientName { get; set; } = string.Empty;

    [Required]
    public ConsultationType ConsultationType { get; set; }

    [Required]
    public DateTime PreferredTime { get; set; }

    [Required]
    [StringLength(500)]
    public string ReasonForVisit { get; set; } = string.Empty;

    public string? IdempotencyKey { get; set; }
}
