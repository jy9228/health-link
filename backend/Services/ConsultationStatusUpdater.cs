namespace HealthLink.Api.Services;

public class ConsultationStatusUpdater : BackgroundService
{
    private readonly DataStore _dataStore;
    private readonly ILogger<ConsultationStatusUpdater> _logger;

    public ConsultationStatusUpdater(DataStore dataStore, ILogger<ConsultationStatusUpdater> logger)
    {
        _dataStore = dataStore;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var count = _dataStore.CompleteExpiredConsultations();
            if (count > 0)
                _logger.LogInformation("Auto-completed {Count} expired consultation(s)", count);

            await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
        }
    }
}
