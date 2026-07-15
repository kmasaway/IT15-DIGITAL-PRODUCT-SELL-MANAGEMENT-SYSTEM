using System.ComponentModel.DataAnnotations;

namespace CoreK.API.DTOs
{
    public class UpdateProductDto
    {
        [Required]
        public int CategoryId { get; set; }

        [Required]
        [StringLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Range(0.01, 100000, ErrorMessage = "Price must be greater than zero.")]
        public decimal Price { get; set; }

        [Range(0, 1000000, ErrorMessage = "Quantity cannot be negative.")]
        public int Quantity { get; set; } = 100;

        public bool IsActive { get; set; } = true;

        [StringLength(50)]
        public string? ApprovalStatus { get; set; }

        [StringLength(500)]
        public string? ReviewRemarks { get; set; }
    }
}
