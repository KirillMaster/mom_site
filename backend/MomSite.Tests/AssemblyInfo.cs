using Xunit;

// Several WebApplicationFactory-based integration test fixtures (see
// AdminMessagesAuthorizationIntegrationTests, AdminReviewsControllerTests)
// configure the JWT signing secret and admin password via process-wide
// environment variables, because Program.cs reads them during host build,
// before any per-test configuration override can run. Environment
// variables are shared across the whole process, so running those test
// classes concurrently (xUnit's default across different collections)
// lets one fixture's teardown null out a secret while another fixture is
// still mid-request, producing flaky spurious 401s. Serializing the suite
// removes the race; the suite is small and fast enough that this costs
// negligible wall-clock time.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
