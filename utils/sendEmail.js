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
    subject: "ٌRASAD - تسلم يدينك تواصلت معنا 🌹",
    html: `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f7; margin: 0; padding: 0; color: #1d1d1f; direction: rtl; }
          .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); padding: 24px; box-sizing: border-box; }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e3e3e3; }
          .header h1 { font-size: 26px; font-weight: 600; color: #333; margin: 0; }
          .content { padding: 24px 0; text-align: center; }
          .content p { font-size: 17px; line-height: 1.6; color: #555; margin: 0 0 16px; }
          .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e3e3e3; color: #888; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>يعطيك العافية 🌹</h1></div>
          <div class="content">
            <p>استلمنا رسالتك وبهالعون نردّ عليك بأقرب وقت.</p>
            <p>${message}</p>
          </div>
          <div class="footer">
            <p>RASADِد سولوشنز</p>
            <p>الرياض - المملكة العربية السعودية</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent:", info.response);
    return info;
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err;
  }
}


/**
 * إرسال إيميل تأكيد استلام طلب وظيفة
 * @param {string} recipientEmail 
 * @param {Object} applicationData - تفاصيل الطلب
 * @param {string} applicationData.fullName
 * @param {string} applicationData.email
 * @param {string} applicationData.phone
 * @param {string} applicationData.message
 * @param {string} applicationData.resumeUrl
 * @param {Object} applicationData.job
 */
async function sendCareerApplicationConfirmationEmail(recipientEmail, applicationData) {
  const { fullName, email, phone, message, resumeUrl, job } = applicationData;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: recipientEmail,
    subject: `RASADِد - استلمنا تقديمك على وظيفة ${job.title} 👌`,
    html: `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f7; margin: 0; padding: 0; color: #1d1d1f; direction: rtl; }
          .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); padding: 24px; box-sizing: border-box; }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e3e3e3; }
          .header h1 { font-size: 26px; font-weight: 600; color: #333; margin: 0; }
          .content { padding: 24px 0; }
          .content p { font-size: 17px; line-height: 1.6; color: #555; margin: 0 0 16px; }
          .highlight { background-color: #f0f8ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-right: 4px solid #007aff; }
          .application-details { background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0; }
          .footer { text-align: center; padding-top: 24px; border-top: 1px solid #e3e3e3; color: #888; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>هلا ${fullName} 👋</h1>
          </div>
          <div class="content">
            <p>يعطيك العافية، استلمنا طلبك على وظيفة <strong>${job.title}</strong>.</p>
            
            <div class="application-details">
              <h3>تفاصيل الطلب:</h3>
              <p><strong>الوظيفة:</strong> ${job.title}</p>
              <p><strong>رقم التقديم:</strong> ${job._id}</p>
              <p><strong>تاريخ التقديم:</strong> ${new Date().toLocaleDateString("ar-SA", { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}</p>
            </div>
            
            <div class="highlight">
              <p><strong>وش بعد؟</strong></p>
              <p>فريق الموارد البشرية بيشوف طلبك، وإذا كان مناسب نتواصل معك خلال ٥-٧ أيام عمل.</p>
            </div>
            
            <p>مقدّرين اهتمامك بـ <strong>RASADِد سولوشنز</strong>، ونتمنى نشوفك معنا ضمن الفريق قريب 🌹</p>
          </div>
          <div class="footer">
            <p>قسم الموارد البشرية - RASADِد سولوشنز</p>
            <p>الرياض - المملكة العربية السعودية</p>
            <p>careers@rasad.sa</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Career application confirmation email sent:", info.response);
    return info;
  } catch (err) {
    console.error("❌ Error sending career application confirmation email:", err);
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
    console.log('📭 ما فيه مقالات هالأسبوع');
    return;
  }

  const blogItems = blogs.map(blog => `
    <div class="blog-item">
      ${blog.image ? `<img src="${blog.image}" alt="${blog.title}" class="blog-image">` : ''}
      <div class="blog-content">
        <h3 class="blog-title">${blog.title}</h3>
        <p class="blog-excerpt">${blog.description}</p>
        <div class="blog-meta">
          <span class="publish-date">
            ${new Date(blog.createdAt).toLocaleDateString('ar-SA', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
          <a href="${blog.link}" class="read-more">اقرأ المزيد →</a>
        </div>
      </div>
    </div>
  `).join('');

  const mailOptions = {
    from: process.env.GMAIL_USER,
    bcc: contactEmails, // BCC عشان ما ينكشف كل الإيميلات
    subject: `RASADِد - جديدنا من مقالات الأسبوع (${new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })})`,
    html: `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f7; margin: 0; padding: 0; color: #1d1d1f; line-height: 1.6; direction: rtl; }
          .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); overflow: hidden; }
          .header { background: linear-gradient(135deg, #007aff, #005ce6); color: white; padding: 32px 24px; text-align: center; }
          .header h1 { font-size: 26px; font-weight: 600; margin: 0 0 8px; }
          .header p { font-size: 15px; margin: 0; opacity: 0.9; }
          .content { padding: 32px 24px; }
          .intro { text-align: center; margin-bottom: 32px; }
          .intro p { font-size: 16px; color: #555; margin: 0; }
          .blog-item { margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e3e3e3; }
          .blog-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
          .blog-image { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px; }
          .blog-title { font-size: 21px; font-weight: 600; color: #333; margin: 0 0 12px; }
          .blog-excerpt { font-size: 15px; color: #666; margin: 0 0 16px; }
          .blog-meta { display: flex; justify-content: space-between; align-items: center; }
          .publish-date { font-size: 13px; color: #888; }
          .read-more { color: #007aff; text-decoration: none; font-weight: 500; font-size: 15px; }
          .read-more:hover { text-decoration: underline; }
          .footer { background-color: #f8f9fa; padding: 24px; text-align: center; color: #666; font-size: 14px; }
          .unsubscribe { margin-top: 16px; }
          .unsubscribe a { color: #888; text-decoration: none; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>جديد مقالات الأسبوع ✨</h1>
            <p>آخر ما كتبناه في الصحة والطب من فريق RASADِد</p>
          </div>
          <div class="content">
            <div class="intro">
              <p>هذي آخر المقالات اللي نزلناها، نتمنى تعجبك وتلقى فيها الفايدة 👇</p>
            </div>
            ${blogItems}
          </div>
          <div class="footer">
            <p><strong>RASADِد سولوشنز</strong></p>
            <p>الرياض - المملكة العربية السعودية</p>
            <p>info@rasad.sa | www.rasad.sa</p>
            <div class="unsubscribe">
              <a href="#">إلغاء الاشتراك من التحديثات الأسبوعية</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📢 تم إرسال النشرة الأسبوعية لـ ${contactEmails.length} شخص:`, info.response);
    return info;
  } catch (err) {
    console.error('❌ خطأ أثناء إرسال النشرة الأسبوعية:', err);
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
    console.log('📭 No services to send this month');
    return;
  }

  // 🖼️ بناء بلوكات الخدمات
  const serviceItems = services.map(service => `
    <div class="service-item">
      ${service.image ? `<img src="${service.image}" alt="${service.title}" class="service-image">` : ''}
      <div class="service-content">
        <div class="service-category">${service.category || 'خدمة طبية'}</div>
        <h3 class="service-title">${service.title}</h3>
        <p class="service-description">${service.description}</p>
        <div class="service-footer">
          ${service.price ? `<span class="service-price">${service.price}</span>` : ''}
          <a href="${service.link}" class="service-cta">اطّلع أكثر →</a>
        </div>
      </div>
    </div>
  `).join('');

  const currentMonth = new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    bcc: contactEmails, // BCC عشان الخصوصية
    subject: `RASAD - خدماتنا الطبية الجديدة - ${currentMonth}`,
    html: `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f7; margin: 0; padding: 0; color: #1d1d1f; line-height: 1.6; }
          .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); overflow: hidden; }
          .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 32px 24px; text-align: center; }
          .header h1 { font-size: 26px; font-weight: 600; margin: 0 0 8px; }
          .header p { font-size: 15px; margin: 0; opacity: 0.9; }
          .content { padding: 32px 24px; }
          .intro { text-align: center; margin-bottom: 32px; }
          .intro p { font-size: 16px; color: #555; margin: 0; }
          .service-item { margin-bottom: 32px; padding: 24px; border: 1px solid #e3e3e3; border-radius: 12px; background-color: #fafafa; }
          .service-item:last-child { margin-bottom: 0; }
          .service-image { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 16px; }
          .service-category { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #28a745; margin-bottom: 8px; }
          .service-title { font-size: 20px; font-weight: 600; color: #333; margin: 0 0 12px; }
          .service-description { font-size: 15px; color: #666; margin: 0 0 20px; }
          .service-footer { display: flex; justify-content: space-between; align-items: center; }
          .service-price { font-size: 17px; font-weight: 600; color: #28a745; }
          .service-cta { background-color: #28a745; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background-color 0.3s; }
          .service-cta:hover { background-color: #218838; }
          .footer { background-color: #f8f9fa; padding: 24px; text-align: center; color: #666; font-size: 13px; }
          .contact-info { margin: 16px 0; }
          .contact-info a { color: #28a745; text-decoration: none; }
          .unsubscribe { margin-top: 16px; }
          .unsubscribe a { color: #888; text-decoration: none; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>خدمات طبية جديدة</h1>
            <p>نطوّر رعايتنا عشان نخدم صحتك بشكل أفضل</p>
          </div>
          <div class="content">
            <div class="intro">
              <p>يسعدنا نعلن لكم عن خدمات طبية جديدة، مصممة بعناية عشان نقدم لك رعاية صحية شاملة على أعلى مستوى.</p>
            </div>
            ${serviceItems}
            <div style="text-align: center; margin-top: 32px; padding: 24px; background-color: #f0f8ff; border-radius: 8px;">
              <h3 style="color: #333; margin: 0 0 12px;">مستعد تبدأ؟</h3>
              <p style="margin: 0 0 16px; color: #666;">تواصل معنا اليوم وتعرّف أكثر عن خدماتنا أو احجز استشارتك.</p>
              <a href="tel:+966123456789" style="display: inline-block; background-color: #007aff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 0 8px;">📞 اتصل الآن</a>
              <a href="mailto:info@RASAD.sa" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 0 8px;">✉️ راسلنا</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>RASAD Solutions</strong></p>
            <div class="contact-info">
              <p>📍 الرياض، المملكة العربية السعودية</p>
              <p>📞 <a href="tel:+966123456789">+966 12 345 6789</a></p>
              <p>📧 <a href="mailto:info@RASAD.sa">info@RASAD.sa</a></p>
              <p>🌐 <a href="https://www.RASAD.sa">www.RASAD.sa</a></p>
            </div>
            <div class="unsubscribe">
              <a href="#">إلغاء الاشتراك من التحديثات الشهرية</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📩 Monthly services newsletter sent to ${contactEmails.length} contacts:`, info.response);
    return info;
  } catch (err) {
    console.error('❌ Error sending monthly services newsletter:', err);
    throw err;
  }
}

module.exports = {
  sendConfirmationEmail,
  sendCareerApplicationConfirmationEmail,
  sendNewBlogsEachWeekToAllContacts,
  sendNewServicesEachMonthToAllContacts
};