using System.ComponentModel.DataAnnotations;

namespace CoreK.API.DTOs
{
    public class CreatePaymentDto
    {
        [Required]
        public int ProductId { get; set; }

        public int CustomerId { get; set; } = 1;

        [Required]
        [StringLength(150)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string CustomerEmail { get; set; } = string.Empty;

        [StringLength(50)]
        public string PaymentMethod { get; set; } = "GCash";
    }
}
