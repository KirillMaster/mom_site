using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MomSite.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PageContents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PageKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ContentKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TextContent = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ImagePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LinkUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PageContents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AuthorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false, defaultValue: 5),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VideoCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Artworks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ImagePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ThumbnailPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IsForSale = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Artworks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Artworks_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Videos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    VideoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ThumbnailPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VideoCategoryId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Videos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Videos_VideoCategories_VideoCategoryId",
                        column: x => x.VideoCategoryId,
                        principalTable: "VideoCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "CreatedAt", "Description", "DisplayOrder", "IsActive", "Name", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8742), "Картины на театральную тематику", 1, true, "Театральные работы", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8743) },
                    { 2, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8748), "Классические натюрморты", 2, true, "Натюрморты", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8748) },
                    { 3, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8750), "Природные пейзажи", 3, true, "Пейзажи", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8750) }
                });

            migrationBuilder.InsertData(
                table: "PageContents",
                columns: new[] { "Id", "ContentKey", "CreatedAt", "DisplayOrder", "ImagePath", "IsActive", "LinkUrl", "PageKey", "TextContent", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "welcome_message", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8830), 1, null, true, null, "home", "Добро пожаловать в мир искусства! Здесь вы найдете уникальные работы в стиле импрессионизма, созданные с любовью и вдохновением.", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8831) },
                    { 2, "banner_image", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8834), 2, "/images/banner-default.jpg", true, null, "home", null, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8834) },
                    { 3, "biography", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8835), 1, null, true, null, "about", "Я художник-импрессионист, вдохновленный красотой окружающего мира. Мои работы отражают любовь к театральному искусству и классическим натюрмортам.", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8836) },
                    { 4, "artist_photo", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8837), 2, "/images/artist-default.jpg", true, null, "about", null, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8837) },
                    { 5, "instagram", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8838), 1, null, true, "https://instagram.com/", "contacts", null, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8838) },
                    { 6, "vk", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8839), 2, null, true, "https://vk.com/", "contacts", null, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8839) },
                    { 7, "telegram", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8840), 3, null, true, "https://t.me/", "contacts", null, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8841) },
                    { 8, "whatsapp", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8842), 4, null, true, "https://wa.me/", "contacts", null, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8842) },
                    { 9, "youtube", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8843), 5, null, true, "https://youtube.com/", "contacts", null, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8843) },
                    { 10, "email", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8844), 6, null, true, null, "contacts", "info@angelamoiseenko.ru", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8844) }
                });

            migrationBuilder.InsertData(
                table: "Reviews",
                columns: new[] { "Id", "AuthorName", "Content", "CreatedAt", "IsActive", "Rating", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "Анна Петрова", "Потрясающие работы! Каждая картина передает особую атмосферу и эмоции. Очень рекомендую!", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8862), true, 5, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8863) },
                    { 2, "Михаил Иванов", "Уникальный стиль и мастерство. Картины завораживают своей красотой и глубиной.", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8866), true, 5, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8866) },
                    { 3, "Елена Сидорова", "Прекрасные натюрморты и театральные работы. Искусство высочайшего уровня!", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8867), true, 5, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8867) }
                });

            migrationBuilder.InsertData(
                table: "VideoCategories",
                columns: new[] { "Id", "CreatedAt", "Description", "DisplayOrder", "IsActive", "Name", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8812), "Видео процесса создания картин", 1, true, "Процесс создания", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8812) },
                    { 2, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8815), "Видео с выставок", 2, true, "Выставки", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8815) },
                    { 3, new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8816), "Интервью и рассказы о творчестве", 3, true, "Интервью", new DateTime(2025, 8, 8, 13, 1, 7, 3, DateTimeKind.Utc).AddTicks(8816) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Artworks_CategoryId",
                table: "Artworks",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Name",
                table: "Categories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PageContents_PageKey_ContentKey",
                table: "PageContents",
                columns: new[] { "PageKey", "ContentKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VideoCategories_Name",
                table: "VideoCategories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Videos_VideoCategoryId",
                table: "Videos",
                column: "VideoCategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Artworks");

            migrationBuilder.DropTable(
                name: "PageContents");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "Videos");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "VideoCategories");
        }
    }
}
