using HealthLink.Api.DTOs;
using HealthLink.Api.Models;
using HealthLink.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HealthLink.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConsultationsController : ControllerBase
{
    private readonly DataStore _dataStore;

    public ConsultationsController(DataStore dataStore)
    {
        _dataStore = dataStore;
    }

    [HttpGet]
    public IActionResult GetAll(
        [FromQuery] string? patientName = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sortOrder = null)
    {
        var consultations = _dataStore.Consultations.AsEnumerable();

        if (!string.IsNullOrEmpty(patientName))
        {
            consultations = consultations.Where(c =>
                c.PatientName.Equals(patientName, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ConsultationStatus>(status, true, out var parsedStatus))
        {
            consultations = consultations.Where(c => c.Status == parsedStatus);
        }

        if (!string.IsNullOrEmpty(search))
        {
            consultations = consultations.Where(c =>
                c.DoctorName.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        consultations = string.Equals(sortOrder, "asc", StringComparison.OrdinalIgnoreCase)
            ? consultations.OrderBy(c => c.PreferredTime)
            : consultations.OrderByDescending(c => c.PreferredTime);

        return Ok(consultations);
    }

    [HttpGet("statistics")]
    public IActionResult GetStatistics()
    {
        var today = TimeZoneHelper.Now().Date;
        const int totalSlotsPerDay = 25;

        var scheduledCountByDoctor = _dataStore.Consultations
            .Where(c => c.Status == ConsultationStatus.Scheduled && TimeZoneHelper.ToAppZone(c.PreferredTime).Date == today)
            .GroupBy(c => c.DoctorId)
            .ToDictionary(g => g.Key, g => g.Count());

        var availableDoctors = _dataStore.Doctors.Count(d =>
        {
            scheduledCountByDoctor.TryGetValue(d.Id, out var booked);
            return booked < totalSlotsPerDay;
        });

        var stats = new DashboardStatistics
        {
            TotalAvailableDoctors = availableDoctors,
            UpcomingConsultations = _dataStore.Consultations.Count(c => c.Status == ConsultationStatus.Scheduled),
            CompletedConsultations = _dataStore.Consultations.Count(c => c.Status == ConsultationStatus.Completed)
        };
        return Ok(stats);
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateConsultationRequest request)
    {
        var doctor = _dataStore.Doctors.FirstOrDefault(d => d.Id == request.DoctorId);
        if (doctor == null)
            return BadRequest(new { error = "Doctor not found." });

        if (!doctor.IsAvailable)
            return BadRequest(new { error = "This doctor is not currently available." });

        if (request.PreferredTime <= TimeZoneHelper.Now().UtcDateTime)
            return BadRequest(new { error = "Preferred time must be in the future." });

        var consultation = new Consultation
        {
            DoctorId = request.DoctorId,
            DoctorName = doctor.Name,
            DoctorSpecialty = doctor.Specialty,
            PatientName = request.PatientName,
            ConsultationType = request.ConsultationType,
            PreferredTime = request.PreferredTime,
            ReasonForVisit = request.ReasonForVisit
        };

        var (created, error, isDuplicate) = _dataStore.AddConsultation(consultation, request.IdempotencyKey);

        if (error != null)
            return Conflict(new { error });

        if (isDuplicate)
            return Ok(created);

        return CreatedAtAction(nameof(GetAll), created);
    }

    [HttpPatch("{id}/cancel")]
    public IActionResult Cancel(int id, [FromQuery] string patientName)
    {
        if (string.IsNullOrEmpty(patientName))
            return BadRequest(new { error = "Patient name is required." });

        var (consultation, error) = _dataStore.CancelConsultation(id, patientName);

        if (error != null)
        {
            if (error.Contains("not found"))
                return NotFound(new { error });
            if (error.Contains("not authorized"))
                return StatusCode(403, new { error });
            return BadRequest(new { error });
        }

        return Ok(consultation);
    }
}
