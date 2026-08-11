using System.Collections.Generic;

namespace AssignmentSystem.Core.DTOs
{
    public class ApiErrorResponse
    {
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<ApiErrorField> Errors { get; set; } = new();
        public string? TraceId { get; set; }
    }

    public class ApiErrorField
    {
        public string Field { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
