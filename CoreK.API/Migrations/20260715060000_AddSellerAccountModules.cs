using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoreK.API.Migrations
{
    /// <inheritdoc />
    [Migration("20260715060000_AddSellerAccountModules")]
    public partial class AddSellerAccountModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SellerSubscriptions",
                columns: table => new
                {
                    SellerSubscriptionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SellerId = table.Column<int>(type: "int", nullable: false),
                    Plan = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BillingCycle = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BillingEmail = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Seats = table.Column<int>(type: "int", nullable: false),
                    AutoRenew = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SellerSubscriptions", x => x.SellerSubscriptionId);
                    table.ForeignKey(
                        name: "FK_SellerSubscriptions_Users_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ValidIdSubmissions",
                columns: table => new
                {
                    ValidIdSubmissionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    IdType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IdNumber = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ValidIdSubmissions", x => x.ValidIdSubmissionId);
                    table.ForeignKey(
                        name: "FK_ValidIdSubmissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SellerSubscriptions_SellerId",
                table: "SellerSubscriptions",
                column: "SellerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ValidIdSubmissions_UserId",
                table: "ValidIdSubmissions",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SellerSubscriptions");

            migrationBuilder.DropTable(
                name: "ValidIdSubmissions");
        }
    }
}
