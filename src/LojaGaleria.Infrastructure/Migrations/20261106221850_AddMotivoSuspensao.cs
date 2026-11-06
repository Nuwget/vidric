using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LojaGaleria.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMotivoSuspensao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MotivoSuspensao",
                table: "Lojas",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SuspensaEm",
                table: "Lojas",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MotivoSuspensao",
                table: "Lojas");

            migrationBuilder.DropColumn(
                name: "SuspensaEm",
                table: "Lojas");
        }
    }
}
