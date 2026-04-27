using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MomSite.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddShowOnHomeToCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Adds a per-category opt-out for the home page carousel.
            // Default true so existing categories keep showing; the admin
            // can untick "Показывать на главной" per category in the
            // /admin/categories page.
            migrationBuilder.AddColumn<bool>(
                name: "ShowOnHome",
                table: "Categories",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowOnHome",
                table: "Categories");
        }
    }
}
