using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MomSite.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveReviewsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(545), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(548) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(555), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(555) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(556), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(556) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(669), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(669) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(672), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(672) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(674), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(674) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(675), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(675) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(676), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(676) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(677), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(677) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(678), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(678) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(679), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(680) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(680), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(681) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(681), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(682) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(646), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(646) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(650), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(650) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(651), new DateTime(2025, 8, 10, 15, 42, 40, 542, DateTimeKind.Utc).AddTicks(651) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AuthorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false, defaultValue: 5),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7406), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7409) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7413), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7413) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7415), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7415) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7510), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7510) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7513), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7514) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7515), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7515) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7516), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7517) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7518), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7518) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7519), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7519) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7520), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7520) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7521), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7522) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7522), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7523) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7524), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7524) });

            migrationBuilder.InsertData(
                table: "Reviews",
                columns: new[] { "Id", "AuthorName", "Content", "CreatedAt", "IsActive", "Rating", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "Анна Петрова", "Потрясающие работы! Каждая картина передает особую атмосферу и эмоции. Очень рекомендую!", new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7565), true, 5, new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7565) },
                    { 2, "Михаил Иванов", "Уникальный стиль и мастерство. Картины завораживают своей красотой и глубиной.", new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7567), true, 5, new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7567) },
                    { 3, "Елена Сидорова", "Прекрасные натюрморты и театральные работы. Искусство высочайшего уровня!", new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7568), true, 5, new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7569) }
                });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7490), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7491) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7494), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7494) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7495), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7495) });
        }
    }
}
