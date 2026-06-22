using System.ComponentModel.DataAnnotations;

namespace CoreK.API.DTOs
{
    public class AddVersionDto
    {
        [Required]
        public string VersionNumber { get; set; } = "1.0.0";

        public string? Changelog { get; set; }
    }
}