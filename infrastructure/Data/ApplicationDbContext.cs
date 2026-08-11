using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Entities will be added here in a later phase.
    }
}
