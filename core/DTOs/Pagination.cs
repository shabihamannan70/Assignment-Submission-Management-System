using System;
using System.Collections.Generic;

namespace AssignmentSystem.Core.DTOs
{
    public class PaginationParams
    {
        private const int MaxPageSize = 100;
        private int _pageSize = 10;
        private int _page = 1;

        public string? Search { get; set; }

        public int Page
        {
            get => _page;
            set => _page = (value < 1) ? 1 : value;
        }

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value < 1) ? 10 : (value > MaxPageSize) ? MaxPageSize : value;
        }
    }

    public class PaginatedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCount / (double)PageSize) : 0;
    }
}
