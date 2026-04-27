using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MomSite.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty.
            //
            // We removed the SeedData() call (and the matching b.HasData(...)
            // blocks from the model snapshot) so EF stops trying to manage
            // those rows. The rows themselves are real production content
            // now — long since edited via the admin UI — so this migration
            // must NOT issue DeleteData. It only exists to anchor the
            // snapshot change in the migrations history.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reversing this is intentionally a no-op too. We don't want to
            // re-introduce stale seed values on top of edited production
            // rows. Restore SeedData() in code if you ever need that.
        }
    }
}
