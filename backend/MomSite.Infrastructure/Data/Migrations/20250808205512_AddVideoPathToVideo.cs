using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MomSite.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoPathToVideo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "VideoUrl",
                table: "Videos",
                newName: "VideoPath");

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

            migrationBuilder.UpdateData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7565), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7565) });

            migrationBuilder.UpdateData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7567), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7567) });

            migrationBuilder.UpdateData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7568), new DateTime(2025, 8, 8, 20, 55, 12, 264, DateTimeKind.Utc).AddTicks(7569) });

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "VideoPath",
                table: "Videos",
                newName: "VideoUrl");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8742), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8743) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8748), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8748) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8750), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8750) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8830), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8831) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8834), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8834) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8835), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8836) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8837), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8837) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8838), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8838) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8839), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8839) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8840), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8841) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8842), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8842) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8843), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8843) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8844), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8844) });

            migrationBuilder.UpdateData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8862), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8863) });

            migrationBuilder.UpdateData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8866), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8866) });

            migrationBuilder.UpdateData(
                table: "Reviews",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8867), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8867) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8812), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8812) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8815), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8815) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8816), new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8816) });
        }
    }
}
