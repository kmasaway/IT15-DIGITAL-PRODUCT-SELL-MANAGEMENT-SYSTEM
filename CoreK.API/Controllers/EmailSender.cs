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

        // DISPATCH 1: Sends the 6-digit code needed to verify the profile registry
        public async Task SendVerificationCodeAsync(string toEmail, string verificationCode)
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
                Subject = "Your CoreK Verification Code",
                Body = $"<h3>Welcome to CoreK!</h3><p>Use this 6-digit code to verify your account:</p><div style='font-size:28px;font-weight:800;letter-spacing:6px;background:#eef6f2;color:#0f291e;border:1px solid #bfe0d3;border-radius:12px;padding:14px 18px;display:inline-block;'>{verificationCode}</div><p>This code is required before you can sign in.</p>",
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
