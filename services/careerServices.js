const Career = require("../models/Career");
const JobApplication = require("../models/JobApplication");
const path = require("path");
const mongoose = require("mongoose");
const slugify = require("slugify");
const { sendCareerApplicationConfirmationEmail } = require("../utils/sendEmail");
// إنشاء وظيفة جديدة
exports.createCareer = async (req, res, next) => {
  try {
    const { title, department, jobType, workType, location, experienceLevel, applicationDeadline } = req.body;

    const career = await Career.create({
      ...req.body,
      slug: slugify(title, { lower: true }),
      applicationDeadline: new Date(applicationDeadline)
    });

    return res.status(201).json({ success: true, data: career });
  } catch (error) {
    next(error);
  }
};


exports.getAllCareers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) filter.$text = { $search: search };
    if (status) filter.status = status;

    const fieldsToSelect = [
      "title",
      "department",
      "jobType",
      "workType",
      "location",
      "createdAt",
      "salary",
      "seo",
      "_id",
      "language",
      "isActive",
      "slug",
      "contentType"
    ].join(" ");

    const [careers, total] = await Promise.all([
      Career.find(filter)

        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select(fieldsToSelect), // حدد الحقول
      Career.countDocuments(filter),
    ]);
const enhancedCareers = careers.map(career => {
      const data = career.toObject();

      // رابط كامل
      data.url = `${req.protocol}://${req.get("host")}/uploads/careers/${path.basename(data.url)}`;

      return data;
    });

    return res.json({
      success: true,
      total,
      currentPage: Number(page),
      pages: Math.ceil(total / limit),
      data: enhancedCareers,
    });
  } catch (error) {
    next(error);
  }
};


// عرض وظيفة واحدة حسب ID أو Slug
exports.getCareerByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    const query = /^[0-9a-fA-F]{24}$/.test(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: idOrSlug };

    const career = await Career.findOne(query);

    if (!career) {
      return res.status(404).json({ success: false, message: "الوظيفة غير موجودة" });
    }

    return res.json({ success: true, data: career });
  } catch (error) {
    next(error);
  }
};
// تقديم طلب توظيف
exports.applyToCareer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, message } = req.body;

    const career = await Career.findById(id);
    if (!career) {
      return res.status(404).json({ success: false, message: "الوظيفة غير موجودة" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "السيرة الذاتية مطلوبة" });
    }

    const application = await JobApplication.create({
      job: id,
      fullName,
      email,
      phone,
      resume: req.file.path,
      message
    });

    const job = await Career.findById(req.params.id).select("title location");

    const resumeUrl = `${req.protocol}://${req.get("host")}uploads/careers/${path.basename(application.resume)}`;
    await sendCareerApplicationConfirmationEmail(email, {
      fullName,
      email,
      phone,
      message,
      resumeUrl,
      job
    });
    res.status(201).json({
      success: true,
      message: "تم تقديم طلب التوظيف بنجاح",
      data: {
        id: application._id,
        fullName: application.fullName,
        email: application.email,
        phone: application.phone,
        resumeUrl,
        status: application.status,
        score: application.score,
        matchingPercentage: application.matchingPercentage,
        source: application.source,
        createdAt: application.createdAt,
        job: {
          id: job?._id,
          title: job?.title,
          location: job?.location,
        }
      }
    });
  } catch (error) {
    // تحقق من تكرار القيم
    if (error.code === 11000) { // E11000 duplicate key error
      return res.status(400).json({
        success: false,
        message: "لقد تقدمت لهذه الوظيفة بالفعل بهذا البريد الإلكتروني",
        errors: Object.keys(error.keyValue).map(field => ({
          field,
          message: `هذا ${field} مستخدم بالفعل`,
          value: error.keyValue[field]
        }))
      });
    }
    next(error);
  }
};
//update career
// تحديث وظيفة
exports.updateCareer = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ slug update
    if (req.body.title) {
      req.body.slug = slugify(req.body.title, { lower: true });
    }

    // ✅ deadline update
    if (req.body.applicationDeadline) {
      req.body.applicationDeadline = new Date(req.body.applicationDeadline);
    }
    // ✅ تحديث الوظيفة
    const career = await Career.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!career) {
      return res.status(404).json({
        success: false,
        message: "الوظيفة غير موجودة"
      });
    }

    return res.json({
      success: true,
      message: "تم تحديث الوظيفة بنجاح",
      data: career
    });
  } catch (error) {
    next(error);
  }
};




exports.deleteCareer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const career = await Career.findByIdAndDelete(id);
    if (!career) {
      return res.status(404).json({ success: false, message: "الوظيفة غير موجودة" });
    }
    return res.json({ success: true,message: "تم حذف الوظيفة بنجاح" });
  } catch (error) {
    next(error);
  }
};
exports.getAllApplicationsByCarrerId = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ تأكد إن الكارير موجود
    const career = await Career.findById(id);
    if (!career) {
      return res.status(404).json({ success: false, message: "Career not found" });
    }

    const applications = await JobApplication.find({ job: id })
      .populate("job", "title slug") // ✅ يجيب العنوان والـ slug
      .lean();

    const enhancedApplications = applications.map(app => ({
      ...app,
      resume: app.resume
        ? `${req.protocol}://${req.get("host")}/${path.basename(app.resume)}`
        : null
    }));

    return res.json({
      success: true,
      count: enhancedApplications.length,
      data: enhancedApplications
    });
  } catch (error) {
    next(error);
  }
};
