const cron = require('node-cron');
const { sendNewBlogsEachWeekToAllContacts, sendNewServicesEachMonthToAllContacts } = require('./utils/sendEmail');
const ContactModel = require('./models/contactModel');
const BlogModel = require('./models/blogModel');
const ServiceModel = require('./models/servicesModel');

/**
 * Weekly Blog Newsletter - كل يوم إثنين الساعة 9 صباحًا
 */
cron.schedule('0 11 * * 2', async () => {
  try {
    console.log('📧 Testing weekly blog newsletter...');

    const contacts = await ContactModel.find().select('email').lean();
    const emails = contacts.map(c => c.email);

    const blogs = await BlogModel.find()
      .select('title description section image createdAt')
      .lean();

    console.log(`Found ${emails.length} contacts and ${blogs.length} blogs`);

    if (emails.length > 0 && blogs.length > 0) {
      // فقط للاختبار: إرسال لبريد واحد
      const testEmails = ['fatma.m.elessawy@gmail.com'];

      await sendNewBlogsEachWeekToAllContacts(
        testEmails, 
        blogs.map(b => ({
          // 👇 حدد اللغة اللي تبيها
          title: b.title?.ar || b.title?.en || '',
          description: b.description?.ar || b.description?.en || '',
          section: b.section?.map(s => ({
            title: s.title?.ar || s.title?.en || '',
            description: s.description?.ar || s.description?.en || '',
            image: s.image?.url || ''
          })) || [],
          image: b.image?.url || '',
          publishDate: new Date(b.createdAt).toLocaleDateString('ar-SA', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        }))
      );

      console.log('✅ Newsletter sent successfully!');
    } else {
      console.log('ℹ️ No emails or blogs to send this week.');
    }
  } catch (err) {
    console.error('❌ Error in weekly blog cron:', err);
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

    const services = await ServiceModel.find({
      isActive: true,
      createdAt: { $gte: oneMonthAgo }
    })
      .select('name description slug image category price createdAt')
      .lean();

    if (emails.length > 0 && services.length > 0) {
      await sendNewServicesEachMonthToAllContacts(
        emails,
        services.map(s => ({
          title: s.name?.en || s.name?.ar || "خدمة بدون عنوان",
          description: s.description?.en || s.description?.ar || "بدون وصف",
          price: s.price || "غير محدد",
          link: `http://46.202.134.87:4000/api/v1/services/${s.slug.en}`,
          image: s.image?.url || "",
          category: s.category,
          publishDate: s.createdAt.toLocaleDateString("ar-EG")
        }))
      );
      console.log('✅ Newsletter sent successfully!');
    } else {
      console.log('ℹ️ No emails or services to send this month.');
    }
  } catch (err) {
    console.error('❌ Error in monthly services cron:', err);
  }
});

