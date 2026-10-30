using System.Text.Json;
using System.Text.Json.Serialization;
using HealthLink.Api.Models;

namespace HealthLink.Api.Services;

public class DataStore
{
    public List<Doctor> Doctors { get; private set; }
    public List<Consultation> Consultations { get; private set; }

    private int _nextConsultationId;
    private readonly object _lock = new();
    private readonly Dictionary<string, Consultation> _idempotencyStore = new();

    private const string DataFilePath = "data/healthlink-data.json";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public DataStore()
    {
        if (File.Exists(DataFilePath))
        {
            try
            {
                var json = File.ReadAllText(DataFilePath);
                var snapshot = JsonSerializer.Deserialize<DataSnapshot>(json, JsonOptions);
                if (snapshot?.Doctors != null && snapshot.Consultations != null)
                {
                    Doctors = snapshot.Doctors;
                    Consultations = snapshot.Consultations;
                    _nextConsultationId = snapshot.NextConsultationId;
                    return;
                }
            }
            catch
            {
                // Corrupted file — fall through to seed data
            }
        }

        Doctors = new List<Doctor>
        {
            new()
            {
                Id = 1,
                Name = "Dr. Sarah Lim",
                Specialty = "General Practitioner",
                AvatarUrl = "https://i.ibb.co/1fny6Fts/dr-sarah-lim-avatar.png",
                IsAvailable = true
            },
            new()
            {
                Id = 2,
                Name = "Dr. Aiman Rashid",
                Specialty = "Family Medicine",
                AvatarUrl = "https://i.ibb.co/WWKgB69J/dr-aiman-rashid-avatar.png",
                IsAvailable = true
            },
            new()
            {
                Id = 3,
                Name = "Dr. Priya Nair",
                Specialty = "Internal Medicine",
                AvatarUrl = "https://i.ibb.co/bymmH4f/dr-priya-nair-avatar.png",
                IsAvailable = true
            },
            new()
            {
                Id = 4,
                Name = "Dr. Daniel Tan",
                Specialty = "General Practitioner",
                AvatarUrl = "https://i.ibb.co/JW9SPcd6/dr-daniel-tan-avatar.png",
                IsAvailable = true
            },
            new()
            {
                Id = 5,
                Name = "Dr. Nur Aisyah",
                Specialty = "Internal Medicine",
                AvatarUrl = "https://i.ibb.co/4CX0fXL/dr-nur-aisyah-avatar.png",
                IsAvailable = true
            }
        };

        Consultations = new List<Consultation>
        {
            new()
            {
                Id = 1,
                DoctorId = 1,
                DoctorName = "Dr. Sarah Lim",
                DoctorSpecialty = "General Practitioner",
                PatientName = "John",
                ConsultationType = ConsultationType.Chat,
                PreferredTime = TimeZoneHelper.Today().AddHours(15).AddMinutes(30).UtcDateTime,
                ReasonForVisit = "Regular health check-up",
                Status = ConsultationStatus.Scheduled,
                CreatedAt = TimeZoneHelper.Now().AddHours(-1).UtcDateTime
            },
            new()
            {
                Id = 2,
                DoctorId = 2,
                DoctorName = "Dr. Aiman Rashid",
                DoctorSpecialty = "Family Medicine",
                PatientName = "John",
                ConsultationType = ConsultationType.VideoCall,
                PreferredTime = new DateTime(2026, 9, 8, 10, 0, 0),
                ReasonForVisit = "Follow-up consultation for blood pressure monitoring",
                Status = ConsultationStatus.Completed,
                CreatedAt = new DateTime(2026, 9, 7, 14, 0, 0)
            },
            new()
            {
                Id = 3,
                DoctorId = 3,
                DoctorName = "Dr. Priya Nair",
                DoctorSpecialty = "Internal Medicine",
                PatientName = "John",
                ConsultationType = ConsultationType.Chat,
                PreferredTime = new DateTime(2026, 9, 2, 14, 0, 0),
                ReasonForVisit = "Persistent headaches and dizziness",
                Status = ConsultationStatus.Completed,
                CreatedAt = new DateTime(2026, 9, 1, 10, 0, 0)
            }
        };

        _nextConsultationId = 4;
    }

    public (Consultation? consultation, string? error, bool isDuplicate) AddConsultation(Consultation consultation, string? idempotencyKey)
    {
        lock (_lock)
        {
            if (!string.IsNullOrEmpty(idempotencyKey) && _idempotencyStore.TryGetValue(idempotencyKey, out var existing))
            {
                return (existing, null, true);
            }

            var hasConflict = Consultations.Any(c =>
                c.DoctorId == consultation.DoctorId &&
                c.PreferredTime == consultation.PreferredTime &&
                c.Status == ConsultationStatus.Scheduled);

            if (hasConflict)
            {
                return (null, "This time slot is already booked for the selected doctor. Please choose a different time.", false);
            }

            consultation.Id = _nextConsultationId++;
            consultation.Status = ConsultationStatus.Scheduled;
            consultation.CreatedAt = TimeZoneHelper.Now().UtcDateTime;
            Consultations.Add(consultation);

            if (!string.IsNullOrEmpty(idempotencyKey))
            {
                _idempotencyStore[idempotencyKey] = consultation;
            }

            SaveToFile();
            return (consultation, null, false);
        }
    }

    public (Consultation? consultation, string? error) CancelConsultation(int id, string patientName)
    {
        lock (_lock)
        {
            var consultation = Consultations.FirstOrDefault(c => c.Id == id);
            if (consultation == null)
                return (null, "Consultation not found.");

            if (!consultation.PatientName.Equals(patientName, StringComparison.OrdinalIgnoreCase))
                return (null, "You are not authorized to cancel this consultation.");

            if (consultation.Status != ConsultationStatus.Scheduled)
                return (null, $"Cannot cancel a consultation that is already {consultation.Status}.");

            consultation.Status = ConsultationStatus.Cancelled;
            SaveToFile();
            return (consultation, null);
        }
    }

    public int CompleteExpiredConsultations()
    {
        lock (_lock)
        {
            var now = TimeZoneHelper.Now();
            var slotDuration = TimeSpan.FromMinutes(30);
            var expired = Consultations
                .Where(c => c.Status == ConsultationStatus.Scheduled && TimeZoneHelper.ToAppZone(c.PreferredTime).Add(slotDuration) < now)
                .ToList();

            foreach (var c in expired)
            {
                c.Status = ConsultationStatus.Completed;
            }

            if (expired.Count > 0)
                SaveToFile();

            return expired.Count;
        }
    }

    private void SaveToFile()
    {
        var snapshot = new DataSnapshot
        {
            Doctors = Doctors,
            Consultations = Consultations,
            NextConsultationId = _nextConsultationId
        };

        var dir = Path.GetDirectoryName(DataFilePath)!;
        if (!Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        var json = JsonSerializer.Serialize(snapshot, JsonOptions);
        File.WriteAllText(DataFilePath, json);
    }

    private class DataSnapshot
    {
        public List<Doctor> Doctors { get; set; } = new();
        public List<Consultation> Consultations { get; set; } = new();
        public int NextConsultationId { get; set; }
    }
}
