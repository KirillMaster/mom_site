using MailKit.Security;
using MomSite.Infrastructure.Notifications;
using Xunit;

namespace MomSite.Tests;

public class EmailNotifierTests
{
    [Fact]
    public void Port_465_expects_TLS_from_the_first_byte()
    {
        Assert.Equal(SecureSocketOptions.SslOnConnect, EmailNotifier.SecurityForPort(465));
    }

    [Theory]
    [InlineData(587)]
    [InlineData(25)]
    [InlineData(2525)]
    public void Other_ports_start_in_the_clear_and_upgrade(int port)
    {
        Assert.Equal(SecureSocketOptions.StartTls, EmailNotifier.SecurityForPort(port));
    }
}
