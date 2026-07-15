using System.ComponentModel.DataAnnotations;

namespace CoreK.API.DTOs
{
    public class CreatePaymentDto
    {
        [Required]
        public int ProductId { get; set; }

        [Range(1, 1000, ErrorMessage = "Quantity must be at least one.")]
        public int Quantity { get; set; } = 1;

        public int CustomerId { get; set; } = 1;

        [StringLength(150)]
        public string CustomerName { get; set; } = string.Empty;

        [EmailAddress]
        public string CustomerEmail { get; set; } = string.Empty;

        [StringLength(50)]
        public string PaymentMethod { get; set; } = "GCash";
    }

    public class CreatePayoutRequestDto
    {
        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }
    }

    public class UpdatePayoutStatusDto
    {
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Remarks { get; set; }
    }
}
