using HealthLink.Api.Models;
using HealthLink.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HealthLink.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly DataStore _dataStore;

    public DoctorsController(DataStore dataStore)
    {
        _dataStore = dataStore;
    }

    private static List<DateTimeOffset> GetAllSlots(DateTimeOffset date)
    {
        var slots = new List<DateTimeOffset>();
        var day = date.Date;
        for (var hour = 9; hour <= 21; hour++)
        {
            foreach (var min in new[] { 0, 30 })
            {
                if (hour == 21 && min == 30) break;
                slots.Add(new DateTimeOffset(day.AddHours(hour).AddMinutes(min), TimeZoneHelper.AppUtcOffset));
            }
        }
        return slots;
    }

    [HttpGet]
    public IActionResult GetAll(
        [FromQuery] string? search = null,
        [FromQuery] string? specialty = null,
        [FromQuery] bool? isAvailable = null)
    {
        var now = TimeZoneHelper.Now();
        var today = now.Date;
        var allSlots = GetAllSlots(now);

        var bookedSlotsByDoctor = _dataStore.Consultations
            .Where(c => c.Status == ConsultationStatus.Scheduled
                        && TimeZoneHelper.ToAppZone(c.PreferredTime).Date == today)
            .GroupBy(c => c.DoctorId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(c => TimeZoneHelper.ToAppZone(c.PreferredTime)).ToHashSet());

        var results = _dataStore.Doctors.Select(d =>
        {
            bookedSlotsByDoctor.TryGetValue(d.Id, out var bookedTimes);
            var booked = bookedTimes ?? new HashSet<DateTimeOffset>();

            var nextSlot = allSlots
                .Where(s => s > now && !booked.Contains(s))
                .OrderBy(s => s)
                .Cast<DateTimeOffset?>()
                .FirstOrDefault();

            return new
            {
                d.Id,
                d.Name,
                d.Specialty,
                d.AvatarUrl,
                IsAvailable = nextSlot.HasValue,
                NextAvailableTime = nextSlot?.UtcDateTime
            };
        }).AsEnumerable();

        if (!string.IsNullOrEmpty(search))
        {
            results = results.Where(d =>
                d.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                d.Specialty.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrEmpty(specialty))
        {
            results = results.Where(d =>
                d.Specialty.Equals(specialty, StringComparison.OrdinalIgnoreCase));
        }

        if (isAvailable.HasValue)
        {
            results = results.Where(d => d.IsAvailable == isAvailable.Value);
        }

        return Ok(results);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var doctor = _dataStore.Doctors.FirstOrDefault(d => d.Id == id);
        if (doctor == null)
            return NotFound();
        return Ok(doctor);
    }

    [HttpGet("{id}/booked-slots")]
    public IActionResult GetBookedSlots(int id, [FromQuery] string? date = null)
    {
        var doctor = _dataStore.Doctors.FirstOrDefault(d => d.Id == id);
        if (doctor == null)
            return NotFound();

        var targetDate = TimeZoneHelper.Now().Date;
        if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var parsed))
            targetDate = parsed.Date;

        var bookedSlots = _dataStore.Consultations
            .Where(c => c.DoctorId == id
                        && c.Status == ConsultationStatus.Scheduled
                        && TimeZoneHelper.ToAppZone(c.PreferredTime).Date == targetDate)
            .Select(c => TimeZoneHelper.ToAppZone(c.PreferredTime).ToString("yyyy-MM-ddTHH:mm:ss"))
            .ToList();

        return Ok(bookedSlots);
    }
}
