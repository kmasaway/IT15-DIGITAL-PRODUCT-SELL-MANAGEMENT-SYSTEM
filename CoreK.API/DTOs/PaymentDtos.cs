using System.ComponentModel.DataAnnotations;

namespace CoreK.API.DTOs
{
    public class CreatePaymentDto
    {
        [Required]
        public int ProductId { get; set; }

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
    }
}
