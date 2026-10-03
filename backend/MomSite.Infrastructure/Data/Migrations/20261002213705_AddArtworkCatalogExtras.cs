using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MomSite.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddArtworkCatalogExtras : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "WidthCm",
                table: "Artworks",
                type: "numeric(6,1)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "HeightCm",
                table: "Artworks",
                type: "numeric(6,1)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Artworks",
                type: "character varying(5000)",
                maxLength: 5000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "Artworks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                table: "Artworks",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "NeedsReshoot",
                table: "Artworks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ShortDescription",
                table: "Artworks",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "NeedsReshoot",
                table: "Artworks");

            migrationBuilder.DropColumn(
                name: "ShortDescription",
                table: "Artworks");

            migrationBuilder.AlterColumn<int>(
                name: "WidthCm",
                table: "Artworks",
                type: "integer",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,1)",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "HeightCm",
                table: "Artworks",
                type: "integer",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,1)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Artworks",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(5000)",
                oldMaxLength: 5000,
                oldNullable: true);
        }
    }
}
