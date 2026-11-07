using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LojaGaleria.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceiroContasPagarCaixa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Caixas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    LojaId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DataAbertura = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UsuarioAberturaId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ValorAbertura = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    DataFechamento = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UsuarioFechamentoId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ValorFechamentoInformado = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    ValorFechamentoCalculado = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    Diferenca = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true),
                    Observacoes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Caixas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContasPagar",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    LojaId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Descricao = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    Categoria = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Valor = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Vencimento = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Pago = table.Column<bool>(type: "INTEGER", nullable: false),
                    DataPagamento = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Observacoes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContasPagar", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MovimentosCaixa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    LojaId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CaixaId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Valor = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Descricao = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    DataHora = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "TEXT", nullable: false),
                    VendaId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ContaPagarId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimentosCaixa", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovimentosCaixa_Caixas_CaixaId",
                        column: x => x.CaixaId,
                        principalTable: "Caixas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Caixas_LojaId_DataAbertura",
                table: "Caixas",
                columns: new[] { "LojaId", "DataAbertura" });

            migrationBuilder.CreateIndex(
                name: "IX_Caixas_LojaId_Status",
                table: "Caixas",
                columns: new[] { "LojaId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ContasPagar_LojaId",
                table: "ContasPagar",
                column: "LojaId");

            migrationBuilder.CreateIndex(
                name: "IX_ContasPagar_LojaId_Pago_Vencimento",
                table: "ContasPagar",
                columns: new[] { "LojaId", "Pago", "Vencimento" });

            migrationBuilder.CreateIndex(
                name: "IX_MovimentosCaixa_CaixaId_DataHora",
                table: "MovimentosCaixa",
                columns: new[] { "CaixaId", "DataHora" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContasPagar");

            migrationBuilder.DropTable(
                name: "MovimentosCaixa");

            migrationBuilder.DropTable(
                name: "Caixas");
        }
    }
}
