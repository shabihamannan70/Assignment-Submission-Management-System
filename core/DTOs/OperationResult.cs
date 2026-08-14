namespace AssignmentSystem.Core.DTOs
{
    public class OperationResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }

        public static OperationResult Ok() => new OperationResult { Success = true };
        public static OperationResult Fail(string message) => new OperationResult { Success = false, ErrorMessage = message };
    }
}
