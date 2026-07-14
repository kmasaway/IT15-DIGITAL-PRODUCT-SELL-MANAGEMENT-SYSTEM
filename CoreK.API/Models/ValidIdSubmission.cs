using System.ComponentModel.DataAnnotations;

namespace CoreK.API.Models
{
    public class ValidIdSubmission
    {
        public int ValidIdSubmissionId { get; set; }

        public int UserId { get; set; }

        public User? User { get; set; }

        [Required]
        [StringLength(50)]
        public string IdType { get; set; } = string.Empty;

        [Required]
        [StringLength(80)]
        public string IdNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(260)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending Review";

        [StringLength(500)]
        public string? Remarks { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }
    }
}
