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

        public bool IsActive { get; set; } = true;
    }
}
