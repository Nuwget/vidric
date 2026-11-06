using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LojaGaleria.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProdutosAndMovimentoEstoque : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Produtos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    LojaId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Nome = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Modelo = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Cor = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Categoria = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CodigoBarras = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    PrecoVenda = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Custo = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    QtdEstoque = table.Column<int>(type: "INTEGER", nullable: false),
                    EstoqueMinimo = table.Column<int>(type: "INTEGER", nullable: false),
                    Observacoes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Ativo = table.Column<bool>(type: "INTEGER", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Produtos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Produtos_Lojas_LojaId",
                        column: x => x.LojaId,
                        principalTable: "Lojas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MovimentosEstoque",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    LojaId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProdutoId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Quantidade = table.Column<int>(type: "INTEGER", nullable: false),
                    Motivo = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    DataHora = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "TEXT", nullable: false),
                    VendaId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimentosEstoque", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovimentosEstoque_Produtos_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "Produtos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovimentosEstoque_LojaId_ProdutoId_DataHora",
                table: "MovimentosEstoque",
                columns: new[] { "LojaId", "ProdutoId", "DataHora" });

            migrationBuilder.CreateIndex(
                name: "IX_MovimentosEstoque_ProdutoId",
                table: "MovimentosEstoque",
                column: "ProdutoId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_LojaId",
                table: "Produtos",
                column: "LojaId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_LojaId_Ativo",
                table: "Produtos",
                columns: new[] { "LojaId", "Ativo" });

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_LojaId_CodigoBarras",
                table: "Produtos",
                columns: new[] { "LojaId", "CodigoBarras" },
                unique: true,
                filter: "CodigoBarras IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_LojaId_QtdEstoque_EstoqueMinimo",
                table: "Produtos",
                columns: new[] { "LojaId", "QtdEstoque", "EstoqueMinimo" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovimentosEstoque");

            migrationBuilder.DropTable(
                name: "Produtos");
        }
    }
}
