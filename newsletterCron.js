const cron = require('node-cron');
const { sendNewBlogsEachWeekToAllContacts, sendNewServicesEachMonthToAllContacts } = require('./utils/sendEmail');
const ContactModel = require('./models/contactModel');
const BlogModel = require('./models/blogModel');
const ServiceModel = require('./models/servicesModel');

/**
 * Weekly Blog Newsletter - كل يوم إثنين الساعة 9 صباحًا
 */

cron.schedule('* * * * *', async () => {
    try {
      console.log('📧 Testing weekly blog newsletter...');
  
      const contacts = await ContactModel.find().select('email').lean();
      const emails = contacts.map(c => c.email);
  
      const blogs = await BlogModel.find({ isActive: true })
        .select('title excerpt slug featuredImage createdAt')
        .lean();
  
      console.log(`Found ${emails.length} contacts and ${blogs.length} blogs`);
  
      if (emails.length > 0 && blogs.length > 0) {
        // فقط للاختبار: يمكنك إرسال إل ى إيميلك الخاص
       //  const testEmails = ['fatma.m.elessawy@gmail.com'];
         await sendNewBlogsEachWeekToAllContacts(emails, blogs.map(b => ({
            title: b.title,
            excerpt: b.excerpt,
            link: `http://46.202.134.87:4000/api/v1/blogs/${b.slug}`,
            image: b.featuredImage,
            publishDate: b.createdAt.toLocaleDateString()
          })));
          
        console.log('Newsletter sent successfully!');
      } else {
        console.log('No emails or blogs to send this week.');
      }
    } catch (err) {
      console.error('Error in weekly blog cron:', err);
    }
  });
  
/**
 * Monthly Services Newsletter - يوم 1 من كل شهر الساعة 10 صباحًا
 */
cron.schedule('0 10 1 * *', async () => {
  try {
    console.log('📧 Testing monthly services newsletter...');

    // جلب كل جهات الاتصال
    const contacts = await ContactModel.find().select('email').lean();
    const emails = contacts.map(c => c.email);

    // جلب آخر 30 يوم من الخدمات الجديدة
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const services = await ServiceModel.find({ isActive: true, createdAt: { $gte: oneMonthAgo } })
      .select('title description price slug featuredImage category')
      .lean();

    if (emails.length > 0 && services.length > 0) {
      await sendNewServicesEachMonthToAllContacts(emails, services.map(s => ({
        title: s.title,
        description: s.description,
        price: s.price,
        link: `http://46.202.134.87:4000/api/v1/services/${s.slug}`,
        image: s.featuredImage,
        category: s.category
      })));
    } else {
      console.log('No emails or services to send this month.');
    }
  } catch (err) {
    console.error('Error in monthly services cron:', err);
  }
});
