using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MomSite.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBlog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BlogCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlogCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BlogPosts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Excerpt = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    BodyHtml = table.Column<string>(type: "text", nullable: false),
                    CoverImagePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CoverAlt = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SeoTitle = table.Column<string>(type: "character varying(70)", maxLength: 70, nullable: true),
                    SeoDescription = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    BlogCategoryId = table.Column<int>(type: "integer", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlogPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BlogPosts_BlogCategories_BlogCategoryId",
                        column: x => x.BlogCategoryId,
                        principalTable: "BlogCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BlogPostArtworks",
                columns: table => new
                {
                    BlogPostId = table.Column<int>(type: "integer", nullable: false),
                    ArtworkId = table.Column<int>(type: "integer", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlogPostArtworks", x => new { x.BlogPostId, x.ArtworkId });
                    table.ForeignKey(
                        name: "FK_BlogPostArtworks_Artworks_ArtworkId",
                        column: x => x.ArtworkId,
                        principalTable: "Artworks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BlogPostArtworks_BlogPosts_BlogPostId",
                        column: x => x.BlogPostId,
                        principalTable: "BlogPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BlogCategories_Slug",
                table: "BlogCategories",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BlogPostArtworks_ArtworkId",
                table: "BlogPostArtworks",
                column: "ArtworkId");

            migrationBuilder.CreateIndex(
                name: "IX_BlogPosts_BlogCategoryId",
                table: "BlogPosts",
                column: "BlogCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_BlogPosts_PublishedAt",
                table: "BlogPosts",
                column: "PublishedAt");

            migrationBuilder.CreateIndex(
                name: "IX_BlogPosts_Slug",
                table: "BlogPosts",
                column: "Slug",
                unique: true);

            // Стартовые рубрики (A-2). Дальше мама правит их в админке — EF ими не управляет.
            migrationBuilder.InsertData(
                table: "BlogCategories",
                columns: new[] { "Slug", "Name", "DisplayOrder" },
                values: new object[,]
                {
                    { "novosti", "Новости", 0 },
                    { "krym-i-sevastopol", "Крым и Севастополь", 1 },
                    { "kak-vybrat-kartinu", "Как выбрать картину", 2 },
                    { "istorii-kartin", "Истории картин", 3 },
                    { "teatr-i-cirk", "Театр и цирк", 4 },
                    { "masterskaya", "Мастерская", 5 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BlogPostArtworks");

            migrationBuilder.DropTable(
                name: "BlogPosts");

            migrationBuilder.DropTable(
                name: "BlogCategories");
        }
    }
}
