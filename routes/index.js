const express = require('express');
const router = express.Router();

// ========================================
// WEBSITE ROUTES
// ========================================
router.use('/home', require('./homeRoutes'));
router.use('/about', require('./aboutRoutes'));
router.use('/services', require('./servicesRoutes'));
router.use('/portfolio', require('./PortfolioRoutes'));
router.use('/blog', require('./blogRoutes'));
router.use('/careers', require('./careers'));
router.use('/contact', require('./contactRoutes'));
router.use('/technologies', require('./technologiesRoutes'));
router.use('/testimonials', require('./testimonialRoutes'));
router.use('/mailing-list', require('./mailingListRoutes'));
router.use('/privacy-policy', require('./privacyPolicy'));
router.use('/terms-and-conditions', require('./TermsAndConditions'));

// ========================================
// AUTHENTICATION & USERS
// ========================================
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/employees', require('./employeeRoutes'));
router.use('/clients', require('./clientRoutes'));

// ========================================
// PROJECT MANAGEMENT (AGILE) MODULE
// ========================================
router.use('/projects', require('./projectRoutes'));
router.use('/agile/gantt', require('./agile/projectGantt'));
router.use('/agile/kpi', require('./agile/projectKPI'));

// ========================================
// SOFTWARE DEVELOPMENT MODULE
// ========================================
router.use('/software/bugs', require('./software/bugTracker'));
router.use('/software/code-reviews', require('./software/codeReview'));
router.use('/software/technical-debt', require('./software/technicalDebt'));

// ========================================
// MARKETING MODULE
// ========================================
router.use('/marketing/campaigns', require('./marketing/campaign'));
router.use('/marketing/content-calendar', require('./marketing/contentCalendar'));
router.use('/marketing/ai-content', require('./marketing/aiContentGenerator'));

// ========================================
// SALES MODULE
// ========================================
router.use('/sales/lead-scoring', require('./sales/leadScoring'));
router.use('/sales/proposals', require('./sales/proposalGenerator'));

// ========================================
// ACCOUNTING MODULE
// ========================================
router.use('/accounting/project-billing', require('./accounting/projectBilling'));
router.use('/accounting/cash-flow-forecast', require('./accounting/cashFlowForecast'));

// ========================================
// HR MODULE
// ========================================
router.use('/hr/capacity-planner', require('./hr/capacityPlanner'));
router.use('/hr/performance-reviews', require('./hr/performanceReview'));
router.use('/hr/payroll', require('./hr/payrollAutomation'));

// ========================================
// CEO DASHBOARD MODULE
// ========================================
router.use('/ceo/executive-kpi', require('./ceo/executiveKPI'));
router.use('/ceo/early-warning', require('./ceo/earlyWarning'));
router.use('/ceo/predictive-analytics', require('./ceo/predictiveAnalytics'));

// ========================================
// API INFO & HEALTH CHECK
// ========================================
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Abwab Digital ERP API',
    version: '1.0.0',
    modules: {
      website: 'Website content management',
      authentication: 'User authentication & authorization',
      projectManagement: 'Agile project management with Gantt & KPI tracking',
      software: 'Bug tracking, code reviews, technical debt management',
      marketing: 'Campaign management, content calendar, AI content generation',
      sales: 'Lead scoring with AI, proposal generation',
      accounting: 'Project billing, cash flow forecasting',
      hr: 'Capacity planning, performance reviews, payroll automation',
      ceoDashboard: 'Executive KPIs, early warning system, predictive analytics'
    },
    documentation: '/api/v1/docs',
    status: 'operational'
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableModules: [
      '/api/v1/agile',
      '/api/v1/software',
      '/api/v1/marketing',
      '/api/v1/sales',
      '/api/v1/accounting',
      '/api/v1/hr',
      '/api/v1/ceo'
    ]
  });
});

module.exports = router;
