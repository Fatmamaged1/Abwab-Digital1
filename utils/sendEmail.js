// services/sendEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // ضع بريد Gmail هنا أو في .env
    pass: process.env.GMAIL_APP_PASSWORD // ضع App Password هنا أو في .env
  }
});

/**
 * Send confirmation email to a user
 * @param {string} recipientEmail  
 * @param {string} message  
 */
async function sendConfirmationEmail(recipientEmail, message) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: recipientEmail,
    subject: 'RASAD - Thank you for contacting us',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f7; margin: 0; padding: 0; color: #1d1d1f; }
          .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); padding: 24px; box-sizing: border-box; }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e3e3e3; }
          .header h1 { font-size: 28px; font-weight: 600; color: #333; margin: 0; }
          .content { padding: 24px 0; text-align: center; }
          .content p { font-size: 17px; line-height: 1.6; color: #555; margin: 0 0 16px; }
          .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e3e3e3; color: #888; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Thank you for contacting us</h1></div>
          <div class="content">
            <p>We have received your message and will get back to you as soon as possible.</p>
            <p>${message}</p>
          </div>
          <div class="footer">
            <p>RASAD Solutions</p>
            <p>Riyadh, Saudi Arabia</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
}

/**
 * Send career application confirmation email
 * @param {string} recipientEmail 
 * @param {Object} applicationData - Object containing application details
 * @param {string} applicationData.fullName
 * @param {string} applicationData.position
 * @param {string} applicationData.applicationId
 */
async function sendCareerApplicationConfirmationEmail(recipientEmail, applicationData) {
//   const { fullName, position, applicationId } = applicationData;
  const { fullName, email, phone, message, resumeUrl, job } = applicationData;
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: recipientEmail,
    subject: `RASAD - Career Application Confirmation - ${job.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f7; margin: 0; padding: 0; color: #1d1d1f; }
          .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); padding: 24px; box-sizing: border-box; }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e3e3e3; }
          .header h1 { font-size: 28px; font-weight: 600; color: #333; margin: 0; }
          .content { padding: 24px 0; }
          .content p { font-size: 17px; line-height: 1.6; color: #555; margin: 0 0 16px; }
          .highlight { background-color: #f0f8ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #007aff; }
          .application-details { background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0; }
          .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e3e3e3; color: #888; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Career Application Received</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>Thank you for your interest in joining RASAD Solutions. We have successfully received your application for the <strong>${job.title}</strong> position.</p>
            
            <div class="application-details">
              <h3>Application Details:</h3>
              <p><strong>Position:</strong> ${job.title}</p>
              <p><strong>Application ID:</strong> ${job._id}</p>
              <p><strong>Submitted Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            
            <div class="highlight">
              <p><strong>What's Next?</strong></p>
              <p>Our HR team will review your application and contact you within 5-7 business days if your qualifications match our requirements.</p>
            </div>
            
            <p>We appreciate your interest in RASAD Solutions and look forward to potentially welcoming you to our team.</p>
          </div>
          <div class="footer">
            <p>RASAD Solutions - HR Department</p>
            <p>Riyadh, Saudi Arabia</p>
            <p>careers@RASAD.sa</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Career application confirmation email sent:', info.response);
    return info;
  } catch (err) {
    console.error('Error sending career application confirmation email:', err);
    throw err;
  }
}

/**
 * Send weekly blog updates to all contacts
 * @param {Array} contactEmails - Array of email addresses
 * @param {Array} blogs - Array of blog objects
 * @param {string} blogs[].title
 * @param {string} blogs[].excerpt
 * @param {string} blogs[].link
 * @param {string} blogs[].image
 * @param {string} blogs[].publishDate
 */
async function sendNewBlogsEachWeekToAllContacts(contactEmails, blogs) {
  if (!blogs || blogs.length === 0) {
    console.log('No blogs to send');
    return;
  }

  const blogItems = blogs.map(blog => `
    <div class="blog-item">
      ${blog.image ? `<img src="${blog.image}" alt="${blog.title}" class="blog-image">` : ''}
      <div class="blog-content">
        <h3 class="blog-title">${blog.title}</h3>
        <p class="blog-excerpt">${blog.excerpt}</p>
        <div class="blog-meta">
          <span class="publish-date">${blog.publishDate}</span>
          <a href="${blog.link}" class="read-more">Read More →</a>
        </div>
      </div>
    </div>
  `).join('');

  const mailOptions = {
    from: process.env.GMAIL_USER,
    bcc: contactEmails, // Use BCC to hide recipient emails from each other
    subject: `RASAD - Weekly Health & Medical Insights - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f7; margin: 0; padding: 0; color: #1d1d1f; line-height: 1.6; }
          .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); overflow: hidden; }
          .header { background: linear-gradient(135deg, #007aff, #005ce6); color: white; padding: 32px 24px; text-align: center; }
          .header h1 { font-size: 28px; font-weight: 600; margin: 0 0 8px; }
          .header p { font-size: 16px; margin: 0; opacity: 0.9; }
          .content { padding: 32px 24px; }
          .intro { text-align: center; margin-bottom: 32px; }
          .intro p { font-size: 17px; color: #555; margin: 0; }
          .blog-item { margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e3e3e3; }
          .blog-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
          .blog-image { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px; }
          .blog-content { }
          .blog-title { font-size: 22px; font-weight: 600; color: #333; margin: 0 0 12px; }
          .blog-excerpt { font-size: 16px; color: #666; margin: 0 0 16px; }
          .blog-meta { display: flex; justify-content: space-between; align-items: center; }
          .publish-date { font-size: 14px; color: #888; }
          .read-more { color: #007aff; text-decoration: none; font-weight: 500; font-size: 16px; }
          .read-more:hover { text-decoration: underline; }
          .footer { background-color: #f8f9fa; padding: 24px; text-align: center; color: #666; font-size: 14px; }
          .unsubscribe { margin-top: 16px; }
          .unsubscribe a { color: #888; text-decoration: none; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Weekly Health Insights</h1>
            <p>Your trusted source for medical knowledge and wellness tips</p>
          </div>
          <div class="content">
            <div class="intro">
              <p>Discover the latest in healthcare, medical research, and wellness advice from RASAD's expert team.</p>
            </div>
            ${blogItems}
          </div>
          <div class="footer">
            <p><strong>RASAD Solutions</strong></p>
            <p>Riyadh, Saudi Arabia</p>
            <p>info@RASAD.sa | www.RASAD.sa</p>
            <div class="unsubscribe">
              <a href="#">Unsubscribe from weekly updates</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Weekly blog newsletter sent to ${contactEmails.length} contacts:`, info.response);
    return info;
  } catch (err) {
    console.error('Error sending weekly blog newsletter:', err);
    throw err;
  }
}

/**
 * Send monthly service updates to all contacts
 * @param {Array} contactEmails - Array of email addresses
 * @param {Array} services - Array of service objects
 * @param {string} services[].title
 * @param {string} services[].description
 * @param {string} services[].price
 * @param {string} services[].link
 * @param {string} services[].image
 * @param {string} services[].category
 */
async function sendNewServicesEachMonthToAllContacts(contactEmails, services) {
  if (!services || services.length === 0) {
    console.log('No services to send');
    return;
  }

  const serviceItems = services.map(service => `
    <div class="service-item">
      ${service.image ? `<img src="${service.image}" alt="${service.title}" class="service-image">` : ''}
      <div class="service-content">
        <div class="service-category">${service.category || 'Medical Service'}</div>
        <h3 class="service-title">${service.title}</h3>
        <p class="service-description">${service.description}</p>
        <div class="service-footer">
          ${service.price ? `<span class="service-price">${service.price}</span>` : ''}
          <a href="${service.link}" class="service-cta">Learn More →</a>
        </div>
      </div>
    </div>
  `).join('');

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    bcc: contactEmails,
    subject: `RASAD - New Medical Services Available - ${currentMonth}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f7; margin: 0; padding: 0; color: #1d1d1f; line-height: 1.6; }
          .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); overflow: hidden; }
          .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 32px 24px; text-align: center; }
          .header h1 { font-size: 28px; font-weight: 600; margin: 0 0 8px; }
          .header p { font-size: 16px; margin: 0; opacity: 0.9; }
          .content { padding: 32px 24px; }
          .intro { text-align: center; margin-bottom: 32px; }
          .intro p { font-size: 17px; color: #555; margin: 0; }
          .service-item { margin-bottom: 32px; padding: 24px; border: 1px solid #e3e3e3; border-radius: 12px; background-color: #fafafa; }
          .service-item:last-child { margin-bottom: 0; }
          .service-image { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 16px; }
          .service-category { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #28a745; letter-spacing: 0.5px; margin-bottom: 8px; }
          .service-title { font-size: 22px; font-weight: 600; color: #333; margin: 0 0 12px; }
          .service-description { font-size: 16px; color: #666; margin: 0 0 20px; }
          .service-footer { display: flex; justify-content: space-between; align-items: center; }
          .service-price { font-size: 18px; font-weight: 600; color: #28a745; }
          .service-cta { background-color: #28a745; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background-color 0.3s; }
          .service-cta:hover { background-color: #218838; }
          .footer { background-color: #f8f9fa; padding: 24px; text-align: center; color: #666; font-size: 14px; }
          .contact-info { margin: 16px 0; }
          .contact-info a { color: #28a745; text-decoration: none; }
          .unsubscribe { margin-top: 16px; }
          .unsubscribe a { color: #888; text-decoration: none; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Medical Services</h1>
            <p>Expanding our care to better serve your health needs</p>
          </div>
          <div class="content">
            <div class="intro">
              <p>We're excited to announce new medical services designed to provide you with comprehensive, world-class healthcare solutions.</p>
            </div>
            ${serviceItems}
            <div style="text-align: center; margin-top: 32px; padding: 24px; background-color: #f0f8ff; border-radius: 8px;">
              <h3 style="color: #333; margin: 0 0 12px;">Ready to Get Started?</h3>
              <p style="margin: 0 0 16px; color: #666;">Contact us today to learn more about our services or schedule a consultation.</p>
              <a href="tel:+966123456789" style="display: inline-block; background-color: #007aff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 0 8px;">Call Now</a>
              <a href="mailto:info@RASAD.sa" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 0 8px;">Email Us</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>RASAD Solutions</strong></p>
            <div class="contact-info">
              <p>📍 Riyadh, Saudi Arabia</p>
              <p>📞 <a href="tel:+966123456789">+966 12 345 6789</a></p>
              <p>📧 <a href="mailto:info@RASAD.sa">info@RASAD.sa</a></p>
              <p>🌐 <a href="https://www.RASAD.sa">www.RASAD.sa</a></p>
            </div>
            <div class="unsubscribe">
              <a href="#">Unsubscribe from monthly updates</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Monthly services newsletter sent to ${contactEmails.length} contacts:`, info.response);
    return info;
  } catch (err) {
    console.error('Error sending monthly services newsletter:', err);
    throw err;
  }
}

module.exports = {
  sendConfirmationEmail,
  sendCareerApplicationConfirmationEmail,
  sendNewBlogsEachWeekToAllContacts,
  sendNewServicesEachMonthToAllContacts
};