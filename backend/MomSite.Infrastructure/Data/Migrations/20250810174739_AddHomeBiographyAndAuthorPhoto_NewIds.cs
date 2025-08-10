using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MomSite.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddHomeBiographyAndAuthorPhoto_NewIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2201), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2204) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2237), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2237) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2238), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2238) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2365), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2365) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2369), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2369) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2370), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2370) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2371), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2371) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2372), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2372) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2373), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2373) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2374), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2374) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2376), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2376) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2377), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2377) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2378), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2378) });

            migrationBuilder.InsertData(
                table: "PageContents",
                columns: new[] { "Id", "ContentKey", "CreatedAt", "DisplayOrder", "ImagePath", "IsActive", "LinkUrl", "PageKey", "TextContent", "UpdatedAt" },
                values: new object[,]
                {
                    { 11, "home_biography_text", new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2379), 3, null, true, null, "home", "Это текст биографии автора для главной страницы.", new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2380) },
                    { 12, "home_author_photo", new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2380), 4, "/images/artist-default.jpg", true, null, "home", null, new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2380) }
                });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2342), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2343) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2346), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2346) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2347), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2348) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 12);

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
    }
}
