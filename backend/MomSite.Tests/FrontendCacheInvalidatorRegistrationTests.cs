using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MomSite.Core.Interfaces;
using MomSite.Infrastructure.Services;
using Xunit;

namespace MomSite.Tests
{
    public class FrontendCacheInvalidatorRegistrationTests
    {
        [Fact]
        public void TypedHttpClientRegistration_ResolvesInvalidator()
        {
            var services = new ServiceCollection();
            services.AddLogging();
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
            services.AddHttpClient<ICacheInvalidator, FrontendCacheInvalidator>();

            using var provider = services.BuildServiceProvider();
            using var scope = provider.CreateScope();

            Assert.IsType<FrontendCacheInvalidator>(scope.ServiceProvider.GetRequiredService<ICacheInvalidator>());
        }
    }
}
