namespace HealthLink.Api.Services;

public static class TimeZoneHelper
{
    public static readonly TimeSpan AppUtcOffset = TimeSpan.FromHours(8);

    public static DateTimeOffset Now()
    {
        return DateTimeOffset.UtcNow.ToOffset(AppUtcOffset);
    }

    public static DateTimeOffset Today()
    {
        var now = Now();
        return new DateTimeOffset(now.Date, AppUtcOffset);
    }

    public static DateTimeOffset ToAppZone(DateTime dt)
    {
        return new DateTimeOffset(dt.ToUniversalTime(), TimeSpan.Zero).ToOffset(AppUtcOffset);
    }
}
