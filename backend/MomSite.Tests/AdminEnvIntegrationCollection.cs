using Xunit;

namespace MomSite.Tests
{
    // AdminMessagesAuthorizationIntegrationTests and AdminReviewsControllerTests
    // both set process-wide JWT__Secret / AdminPassword environment variables,
    // because Program.cs reads them while building the host, before any
    // per-test configuration override can run. Running them concurrently lets
    // one fixture's teardown null out a secret while the other is mid-request,
    // producing flaky 401s. This collection serializes just those two classes;
    // the rest of the suite keeps running in parallel.
    [CollectionDefinition("AdminEnvIntegration")]
    public class AdminEnvIntegrationCollection
    {
    }
}
