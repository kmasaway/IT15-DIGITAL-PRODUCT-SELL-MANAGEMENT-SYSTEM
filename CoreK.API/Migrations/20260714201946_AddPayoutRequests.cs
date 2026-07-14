using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoreK.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPayoutRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PayoutRequests",
                columns: table => new
                {
                    PayoutRequestId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SellerId = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    PayoutMethod = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PayoutAccountName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    PayoutAccountNumber = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    RangeStart = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RangeEnd = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayoutRequests", x => x.PayoutRequestId);
                    table.ForeignKey(
                        name: "FK_PayoutRequests_Users_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PayoutRequests_SellerId",
                table: "PayoutRequests",
                column: "SellerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PayoutRequests");
        }
    }
}
