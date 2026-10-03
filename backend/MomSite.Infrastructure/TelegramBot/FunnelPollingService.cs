using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MomSite.Core.Interfaces;
using MomSite.Infrastructure.Data;

namespace MomSite.Infrastructure.TelegramBot;

/// <summary>
/// Long-polls the public bot and runs each update through <see cref="FunnelDialog"/>.
/// Disabled (one log line) when FUNNEL_BOT_TOKEN is empty. Logs carry chat id and
/// step only: never text, names, phones or the token.
/// </summary>
public sealed class FunnelPollingService : BackgroundService
{
    private static readonly TimeSpan StateTtl = TimeSpan.FromHours(24);
    private const int DefaultPauseSeconds = 5;

    private readonly IBotApiClient _api;
    private readonly IMemoryCache _cache;
    private readonly ILeadQuota _quota;
    private readonly ChatSendGate _gate;
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<FunnelPollingService> _logger;
    private readonly Func<TimeSpan, CancellationToken, Task> _delay;

    public FunnelPollingService(
        IBotApiClient api, IMemoryCache cache, ILeadQuota quota, ChatSendGate gate,
        IServiceScopeFactory scopes, ILogger<FunnelPollingService> logger,
        Func<TimeSpan, CancellationToken, Task>? delay = null)
    {
        _api = api;
        _cache = cache;
        _quota = quota;
        _gate = gate;
        _scopes = scopes;
        _logger = logger;
        _delay = delay ?? Task.Delay;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (string.IsNullOrWhiteSpace(TelegramBotClient.Token))
        {
            _logger.LogWarning("FUNNEL_BOT_TOKEN is empty: funnel bot disabled");
            return;
        }

        long offset = 0;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = await _api.GetUpdatesAsync(offset, stoppingToken);
                if (!result.Ok)
                {
                    var pause = result.RetryAfterSeconds > 0 ? result.RetryAfterSeconds : DefaultPauseSeconds;
                    await _delay(TimeSpan.FromSeconds(pause), stoppingToken);
                    continue;
                }

                foreach (var update in result.Value ?? Array.Empty<BotUpdate>())
                {
                    offset = update.UpdateId + 1;
                    await SafeProcessAsync(update, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError("Funnel polling loop failed ({ErrorType})", ex.GetType().Name);
                await _delay(TimeSpan.FromSeconds(DefaultPauseSeconds), stoppingToken);
            }
        }
    }

    private async Task SafeProcessAsync(BotUpdate update, CancellationToken ct)
    {
        try
        {
            await ProcessAsync(update, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError("Funnel update {UpdateId} failed ({ErrorType})", update.UpdateId, ex.GetType().Name);
        }
    }

    public async Task ProcessAsync(BotUpdate update, CancellationToken ct)
    {
        var mapped = BotInputMapper.Map(update);
        if (mapped is null)
        {
            return;
        }

        if (mapped.CallbackId is not null)
        {
            await _api.AnswerCallbackQueryAsync(mapped.CallbackId, ct);
        }

        var key = $"funnel:{mapped.ChatId}";
        _cache.TryGetValue(key, out FunnelState? state);

        var artwork = mapped.Input is StartInput start ? await FindArtworkAsync(start.Payload, ct) : null;
        var ctx = new FunnelContext(mapped.User, artwork, _quota.IsExceeded(mapped.User.Id));
        var result = FunnelDialog.Handle(state, mapped.Input, ctx);

        if (result.Lead is not null && !await TrySubmitAsync(result, mapped, ct))
        {
            await SendAsync(mapped.ChatId, new[] { new Reply(FunnelTexts.SaveFailed) }, ct);
            return;
        }

        if (result.State is null)
        {
            _cache.Remove(key);
        }
        else
        {
            _cache.Set(key, result.State, StateTtl);
        }

        _logger.LogInformation("Funnel chat {ChatId} step {Step}", mapped.ChatId, result.State?.Step.ToString() ?? "None");
        await SendAsync(mapped.ChatId, result.Replies, ct);
    }

    private async Task<bool> TrySubmitAsync(FunnelResult result, BotInputMapper.Mapped mapped, CancellationToken ct)
    {
        try
        {
            using var scope = _scopes.CreateScope();
            await scope.ServiceProvider.GetRequiredService<ILeadService>().SubmitAsync(result.Lead!, ct);
            _quota.TryReserve(mapped.User.Id);
            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError("Funnel lead for chat {ChatId} was not saved ({ErrorType})", mapped.ChatId, ex.GetType().Name);
            return false;
        }
    }

    private async Task<ArtworkInfo?> FindArtworkAsync(string? raw, CancellationToken ct)
    {
        var payload = StartPayloadParser.Parse(raw);
        if (payload.Kind != PayloadKind.Artwork || payload.ArtworkId is not { } id)
        {
            return null;
        }

        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var found = await db.Artworks.Visible()
            .Where(a => a.Id == id)
            .Select(a => new { a.Id, a.Title, a.ThumbnailPath })
            .FirstOrDefaultAsync(ct);
        return found is null ? null : new ArtworkInfo(found.Id, found.Title, ToAbsolute(found.ThumbnailPath));
    }

    private static string ToAbsolute(string path) =>
        path.StartsWith("/") ? FunnelTexts.SiteUrl + path : path;

    private async Task SendAsync(long chatId, IReadOnlyList<Reply> replies, CancellationToken ct)
    {
        foreach (var reply in replies)
        {
            await _gate.WaitAsync(chatId, ct);
            if (reply.PhotoUrl is not null)
            {
                var photo = await _api.SendPhotoAsync(chatId, reply.PhotoUrl, reply.Text, reply.Keyboard, ct);
                if (photo.Ok)
                {
                    continue;
                }

                await _gate.WaitAsync(chatId, ct);
            }

            await _api.SendMessageAsync(chatId, reply, ct);
        }
    }
}
