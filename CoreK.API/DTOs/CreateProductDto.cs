using System.ComponentModel.DataAnnotations;

namespace CoreK.API.DTOs
{
    public class CreateProductDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0.01, 100000, ErrorMessage = "Price must be greater than zero.")]
        public decimal Price { get; set; }

        [Range(0, 1000000, ErrorMessage = "Quantity cannot be negative.")]
        public int Quantity { get; set; } = 100;

        [Required]
        public int CategoryId { get; set; }

        public int SellerId { get; set; } = 1;
    }
}
