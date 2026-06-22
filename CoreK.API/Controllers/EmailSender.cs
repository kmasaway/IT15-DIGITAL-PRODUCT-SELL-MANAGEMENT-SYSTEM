using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace CoreK.API.Controllers
{
    public class EmailSender
    {
        private readonly IConfiguration _configuration;

        public EmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // DISPATCH 1: Sends the initial Guid link to verify the profile registry
        public async Task SendVerificationEmailAsync(string toEmail, string verificationToken)
        {
            var smtpServer = "smtp.gmail.com";
            var smtpPort = 587;
            
            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var senderPassword = _configuration["EmailSettings:AppPassword"]; 

            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
            {
                throw new InvalidOperationException("SMTP Configuration keys are missing from appsettings.json!");
            }

            var verificationLink = $"http://localhost:5132/api/Auth/verify-email?token={verificationToken}";

            var fromAddress = new MailAddress(senderEmail, "CoreK Security Portal");
            var toAddress = new MailAddress(toEmail);

            var mailMessage = new MailMessage(fromAddress, toAddress)
            {
                Subject = "Verify Your CoreK System Registry Account",
                Body = $"<h3>Welcome to CoreK!</h3><p>Please click the link below to verify your identity portal context:</p><a href='{verificationLink}' style='background:#00bfa5;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;'>Click here to verify email</a>",
                IsBodyHtml = true
            };

            using var smtpClient = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            await smtpClient.SendMailAsync(mailMessage);
        }

        // DISPATCH 2: Sends the final confirmation welcome email once verification succeeds
        public async Task SendWelcomeConfirmationEmailAsync(string toEmail, string fullName)
        {
            var smtpServer = "smtp.gmail.com";
            var smtpPort = 587;
            
            var senderEmail = _configuration["EmailSettings:SenderEmail"];
            var senderPassword = _configuration["EmailSettings:AppPassword"]; 

            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
            {
                throw new InvalidOperationException("SMTP Configuration keys are missing from appsettings.json!");
            }

            var fromAddress = new MailAddress(senderEmail, "CoreK Security Portal");
            var toAddress = new MailAddress(toEmail);

            var mailMessage = new MailMessage(fromAddress, toAddress)
            {
                Subject = "Account Verified Successfully - CoreK Profile Active",
                Body = $"<h3>Identity Confirmed!</h3><p>Hello {fullName},</p><p>Your CoreK profile has been fully authorized. Your credential restrictions have been removed, and your identity context is now fully operational.</p><p>You may now return to the portal tab and log in safely.</p><br><p>Best regards,<br>CoreK Security Team</p>",
                IsBodyHtml = true
            };

            using var smtpClient = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            await smtpClient.SendMailAsync(mailMessage);
        }
    }
}