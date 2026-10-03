using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MomSite.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddContactBotFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "TelegramUserId",
                table: "ContactMessages",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelegramUsername",
                table: "ContactMessages",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TelegramUserId",
                table: "ContactMessages");

            migrationBuilder.DropColumn(
                name: "TelegramUsername",
                table: "ContactMessages");
        }
    }
}
