using Microsoft.AspNetCore.Mvc;
using MomSite.Infrastructure.Services;

namespace MomSite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly IS3Service _s3Service;

        public TestController(IS3Service s3Service)
        {
            _s3Service = s3Service;
        }

        [HttpGet("s3-status")]
        public async Task<IActionResult> GetS3Status()
        {
            try
            {
                var isConfigured = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_ACCESS_KEY"));
                
                return Ok(new
                {
                    S3Configured = isConfigured,
                    AccessKeySet = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_ACCESS_KEY")),
                    SecretKeySet = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_SECRET_KEY")),
                    ServiceUrlSet = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_SERVICE_URL")),
                    BucketNameSet = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_BUCKET_NAME")),
                    BaseUrlSet = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("S3_BASE_URL"))
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("s3-test")]
        public async Task<IActionResult> TestS3Connection()
        {
            try
            {
                var result = await _s3Service.TestConnectionAsync();
                return Ok(new { success = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
