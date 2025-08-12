using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MomSite.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFooterContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9432), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9434) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9439), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9440) });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9443), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9443) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9560), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9561) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9564), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9564) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9573), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9573) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9574), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9575) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9580), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9580) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9582), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9582) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9584), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9584) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9586), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9586) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9587), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9587) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9588), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9588) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9566), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9566) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9568), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9568) });

            migrationBuilder.InsertData(
                table: "PageContents",
                columns: new[] { "Id", "ContentKey", "CreatedAt", "DisplayOrder", "ImagePath", "IsActive", "LinkUrl", "PageKey", "TextContent", "UpdatedAt" },
                values: new object[,]
                {
                    { 13, "banner_title", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9570), 1, null, true, null, "gallery", "Галерея работ", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9571) },
                    { 14, "banner_description", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9572), 2, null, true, null, "gallery", "Исследуйте коллекцию уникальных работ в стиле импрессионизма. Каждая картина создана с любовью и передает особую атмосферу.", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9572) },
                    { 15, "banner_title", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9577), 3, null, true, null, "about", "Обо мне", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9577) },
                    { 16, "banner_description", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9579), 4, null, true, null, "about", "Познакомьтесь с художником и узнайте больше о моем творческом пути", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9579) },
                    { 17, "phone", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9590), 7, null, true, null, "contacts", "+7 (900) 123-45-67", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9590) },
                    { 18, "banner_title", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9592), 8, null, true, null, "contacts", "Свяжитесь со мной", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9592) },
                    { 19, "banner_description", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9593), 9, null, true, null, "contacts", "Буду рада ответить на ваши вопросы и обсудить идеи!", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9593) },
                    { 20, "description", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9594), 1, null, true, null, "footer", "Художник-импрессионист, создающий уникальные работы в стиле импрессионизма. Специализируюсь на театральных картинах и натюрмортах.", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9594) },
                    { 21, "instagram", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9595), 2, null, true, "https://instagram.com/", "footer", null, new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9596) },
                    { 22, "vk", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9597), 3, null, true, "https://vk.com/", "footer", null, new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9597) },
                    { 23, "telegram", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9598), 4, null, true, "https://t.me/", "footer", null, new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9598) },
                    { 24, "whatsapp", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9599), 5, null, true, "https://wa.me/", "footer", null, new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9600) },
                    { 25, "youtube", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9601), 6, null, true, "https://youtube.com/", "footer", null, new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9601) },
                    { 26, "email", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9604), 7, null, true, null, "footer", "info@angelamoiseenko.ru", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9604) },
                    { 27, "phone", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9606), 8, null, true, null, "footer", "+7 (900) 123-45-67", new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9606) }
                });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9535), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9535) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9539), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9539) });

            migrationBuilder.UpdateData(
                table: "VideoCategories",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9540), new DateTime(2025, 8, 11, 16, 19, 40, 720, DateTimeKind.Utc).AddTicks(9541) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 27);

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

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2379), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2380) });

            migrationBuilder.UpdateData(
                table: "PageContents",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2380), new DateTime(2025, 8, 10, 17, 47, 39, 516, DateTimeKind.Utc).AddTicks(2380) });

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
    }
}
