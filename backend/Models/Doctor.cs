namespace HealthLink.Api.Models;

public class Doctor
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
}
