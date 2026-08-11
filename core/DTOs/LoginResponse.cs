using System;

namespace AssignmentSystem.Core.DTOs
{
    public record LoginResponse(string Token, Guid UserId, string Name, string Role);
}
