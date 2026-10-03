using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MomSite.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddArtworkCatalogFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HeightCm",
                table: "Artworks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Artworks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Support",
                table: "Artworks",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Technique",
                table: "Artworks",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WidthCm",
                table: "Artworks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "Artworks",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"Artworks\" SET \"Status\" = CASE WHEN \"IsForSale\" THEN 0 ELSE 4 END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HeightCm",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "Support",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "Technique",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "WidthCm",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "Year",
                table: "Artworks");
        }
    }
}
