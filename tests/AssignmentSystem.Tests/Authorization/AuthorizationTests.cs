using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Xunit;

namespace AssignmentSystem.Tests.Authorization
{
    public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
#pragma warning disable CS0618
        public TestAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger, UrlEncoder encoder, ISystemClock clock)
            : base(options, logger, encoder, clock)
        {
        }
#pragma warning restore CS0618

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Context.Request.Headers.TryGetValue("TestRole", out var roleHeaders))
            {
                // Anonymous
                return Task.FromResult(AuthenticateResult.Fail("No role provided"));
            }

            var role = roleHeaders.ToString();
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, "TestUser"),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, "Test");

            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }

    public class AssignmentSystemFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureTestServices(services =>
            {
                services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = "Test";
                    options.DefaultChallengeScheme = "Test";
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", options => { });
            });
        }
    }

    public class AuthorizationTests : IClassFixture<AssignmentSystemFactory>
    {
        private readonly HttpClient _client;

        public AuthorizationTests(AssignmentSystemFactory factory)
        {
            _client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });
        }

        private void SetRole(string role)
        {
            _client.DefaultRequestHeaders.Remove("TestRole");
            if (!string.IsNullOrEmpty(role))
            {
                _client.DefaultRequestHeaders.Add("TestRole", role);
            }
        }

        [Fact]
        public async Task AdminEndpoint_Anonymous_ReturnsUnauthorized()
        {
            SetRole(""); // Anonymous
            var response = await _client.GetAsync("/api/admin/classes");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task AdminEndpoint_StudentRole_ReturnsForbidden()
        {
            SetRole("Student");
            var response = await _client.GetAsync("/api/admin/classes");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task TeacherEndpoint_Anonymous_ReturnsUnauthorized()
        {
            SetRole("");
            var response = await _client.GetAsync("/api/assignments/my");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task TeacherEndpoint_StudentRole_ReturnsForbidden()
        {
            SetRole("Student");
            var response = await _client.GetAsync("/api/assignments/my");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task StudentEndpoint_Anonymous_ReturnsUnauthorized()
        {
            SetRole("");
            var response = await _client.GetAsync("/api/student/assignments");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task StudentEndpoint_TeacherRole_ReturnsForbidden()
        {
            SetRole("Teacher");
            var response = await _client.GetAsync("/api/student/assignments");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }
}
