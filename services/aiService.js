const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }

  /**
   * Generate AI content with structured output
   * @private
   */
  async generateContent(prompt, options = {}) {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature || 0.7,
          topK: options.topK || 40,
          topP: options.topP || 0.95,
          maxOutputTokens: options.maxOutputTokens || 8192,
        },
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Generation Error:', error);
      throw new Error(`AI Service Error: ${error.message}`);
    }
  }

  /**
   * Parse JSON response from AI with error handling
   * @private
   */
  parseJSONResponse(text) {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  // ==================== PROJECT MANAGEMENT & BA ====================

  /**
   * Analyze BRD and extract key information
   */
  async analyzeBRD(brdContent) {
    const prompt = `You are a senior business analyst. Analyze the following Business Requirements Document and extract key information.

BRD Content:
${JSON.stringify(brdContent, null, 2)}

Provide analysis in JSON format with:
{
  "complexity": "simple|moderate|complex|very-complex",
  "riskLevel": "low|medium|high|critical",
  "estimatedDuration": "X weeks/months",
  "keyStakeholders": ["list of stakeholders"],
  "criticalRequirements": ["list of critical requirements"],
  "potentialRisks": [{"risk": "description", "mitigation": "strategy"}],
  "recommendations": ["list of recommendations"],
  "estimatedBudget": "budget range in SAR"
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Generate epics from BRD
   */
  async generateEpicsFromBRD(brd) {
    const prompt = `As an agile expert, convert this BRD into actionable Epics for software development.

BRD Summary:
Title: ${brd.project?.title || 'N/A'}
Objectives: ${JSON.stringify(brd.businessObjectives || [])}
Scope: ${JSON.stringify(brd.scope || {})}
Requirements: ${JSON.stringify(brd.functionalRequirements || [])}

Generate epics in JSON format:
{
  "epics": [
    {
      "name": {"ar": "اسم الملحمة", "en": "Epic Name"},
      "description": {"ar": "وصف", "en": "Description"},
      "priority": "critical|high|medium|low",
      "estimatedStoryPoints": number,
      "userStories": [
        {
          "title": {"ar": "عنوان", "en": "Title"},
          "description": {"ar": "وصف", "en": "As a [user], I want [goal] so that [benefit]"},
          "acceptanceCriteria": ["criterion 1", "criterion 2"],
          "storyPoints": number
        }
      ]
    }
  ]
}`;

    const response = await this.generateContent(prompt, { temperature: 0.8 });
    return this.parseJSONResponse(response);
  }

  /**
   * Predict project risks based on project data
   */
  async predictProjectRisks(project) {
    const prompt = `Analyze this project and predict potential risks.

Project Details:
Name: ${project.name}
Duration: ${project.timeline?.duration || 'N/A'}
Team Size: ${project.team?.length || 'N/A'}
Budget: ${project.budget?.total || 'N/A'}
Complexity: ${project.complexity || 'N/A'}

Predict risks in JSON format:
{
  "risks": [
    {
      "category": "scope|schedule|budget|technical|resource|client",
      "description": "risk description",
      "probability": "low|medium|high",
      "impact": "low|medium|high|critical",
      "severity": number (1-10),
      "mitigation": "mitigation strategy",
      "earlyWarningSign": "what to watch for"
    }
  ],
  "overallRiskScore": number (1-100),
  "recommendation": "overall recommendation"
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Suggest task breakdown for a requirement
   */
  async suggestTaskBreakdown(requirement) {
    const prompt = `Break down this requirement into actionable development tasks.

Requirement:
Title: ${requirement.title}
Description: ${requirement.description}
Type: ${requirement.type}
Priority: ${requirement.priority}

Generate tasks in JSON format:
{
  "tasks": [
    {
      "title": {"ar": "عنوان المهمة", "en": "Task Title"},
      "description": {"ar": "وصف", "en": "Description"},
      "type": "development|testing|design|documentation|devops",
      "estimatedHours": number,
      "skills": ["required skills"],
      "dependencies": ["task dependencies"],
      "priority": "critical|high|medium|low"
    }
  ],
  "totalEstimatedHours": number,
  "suggestedAssignees": ["role suggestions"]
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  // ==================== SOFTWARE DEPARTMENT ====================

  /**
   * Predict sprint velocity
   */
  async predictSprintVelocity(team, sprint, historicalVelocity = []) {
    const prompt = `Predict the sprint velocity for this team.

Team Details:
Size: ${team.members?.length || 'N/A'}
Average Velocity: ${historicalVelocity.length > 0 ? (historicalVelocity.reduce((a, b) => a + b, 0) / historicalVelocity.length).toFixed(2) : 'N/A'}
Historical Velocities: ${JSON.stringify(historicalVelocity)}

Sprint Details:
Planned Story Points: ${sprint.plannedStoryPoints || 'N/A'}
Sprint Duration: ${sprint.duration || 2} weeks
Team Capacity: ${sprint.capacity || 'N/A'} hours

Current Factors:
- Holidays: ${sprint.holidays || 0} days
- Team Members on Leave: ${sprint.membersOnLeave || 0}
- New Team Members: ${sprint.newMembers || 0}

Predict in JSON format:
{
  "predictedVelocity": number,
  "confidenceLevel": number (0-100),
  "willMissTarget": boolean,
  "probability": number (0-100),
  "factorsConsidered": ["list of factors"],
  "recommendations": ["recommendations to improve velocity"],
  "riskFactors": ["potential issues"],
  "expectedCompletion": "percentage of planned work"
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Analyze code quality
   */
  async analyzeCodeQuality(codeContent, language = 'javascript') {
    const prompt = `Analyze this ${language} code for quality, security, and best practices.

Code:
\`\`\`${language}
${codeContent}
\`\`\`

Provide analysis in JSON format:
{
  "qualityScore": number (0-100),
  "securityIssues": [
    {
      "severity": "low|medium|high|critical",
      "type": "sql-injection|xss|auth|encryption|etc",
      "description": "issue description",
      "suggestion": "how to fix",
      "line": number
    }
  ],
  "performanceIssues": [
    {
      "severity": "low|medium|high",
      "description": "issue description",
      "suggestion": "optimization suggestion",
      "line": number
    }
  ],
  "bestPracticeViolations": [
    {
      "rule": "rule name",
      "description": "violation description",
      "suggestion": "how to improve",
      "line": number
    }
  ],
  "complexity": number (1-10),
  "maintainability": "poor|fair|good|excellent",
  "overallRecommendations": ["general recommendations"]
}`;

    const response = await this.generateContent(prompt, { temperature: 0.5 });
    return this.parseJSONResponse(response);
  }

  /**
   * Categorize and analyze bug
   */
  async categorizeBug(bugDescription, stepsToReproduce = '', environment = {}) {
    const prompt = `Analyze and categorize this bug report.

Bug Description: ${bugDescription}
Steps to Reproduce: ${stepsToReproduce}
Environment: ${JSON.stringify(environment)}

Categorize in JSON format:
{
  "predictedSeverity": "critical|high|medium|low",
  "predictedPriority": "p0|p1|p2|p3|p4",
  "category": "functionality|performance|security|ui|data|api|integration",
  "rootCauseAnalysis": "potential root cause",
  "affectedModules": ["list of affected modules"],
  "similarBugs": "description of similar issues",
  "suggestedAssignee": "team or role suggestion",
  "estimatedFixTime": "time estimate in hours",
  "testingStrategy": "how to test the fix",
  "preventiveMeasures": "how to prevent similar bugs"
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Suggest bug fix approach
   */
  async suggestBugFix(bug) {
    const prompt = `Suggest a fix approach for this bug.

Bug: ${bug.title}
Description: ${bug.description}
Category: ${bug.category}
Environment: ${JSON.stringify(bug.environment || {})}

Provide fix strategy in JSON format:
{
  "investigationSteps": ["step-by-step investigation"],
  "likelyCauses": ["list of probable causes"],
  "suggestedFix": "detailed fix approach",
  "codeChanges": "areas of code to modify",
  "testingApproach": "how to test the fix",
  "regressionRisks": ["potential side effects"],
  "estimatedTime": "hours to fix"
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  // ==================== MARKETING DEPARTMENT ====================

  /**
   * Generate social media post/caption
   */
  async generatePostCaption(params) {
    const { topic, language, tone, platform, keywords, targetAudience, maxLength } = params;

    const prompt = `Generate a ${platform} post caption about "${topic}".

Requirements:
- Language: ${language === 'both' ? 'Arabic and English (separate versions)' : language}
- Tone: ${tone}
- Target Audience: ${targetAudience}
- Keywords to include: ${keywords?.join(', ')}
- Max Length: ${maxLength || 'optimal for platform'} characters
- Platform: ${platform}

Generate in JSON format:
${language === 'both'
  ? `{
  "ar": "Arabic caption with emojis",
  "en": "English caption with emojis",
  "hashtags": {
    "ar": ["#هاشتاق1", "#هاشتاق2"],
    "en": ["#hashtag1", "#hashtag2"]
  },
  "callToAction": {
    "ar": "عبارة تحفيزية",
    "en": "Call to action"
  },
  "variations": [
    {"ar": "variation 1 ar", "en": "variation 1 en"},
    {"ar": "variation 2 ar", "en": "variation 2 en"}
  ]
}`
  : `{
  "caption": "caption text with emojis",
  "hashtags": ["#tag1", "#tag2"],
  "callToAction": "CTA text",
  "variations": ["variation 1", "variation 2"]
}`
}`;

    const response = await this.generateContent(prompt, { temperature: 0.9 });
    return this.parseJSONResponse(response);
  }

  /**
   * Optimize marketing campaign
   */
  async optimizeCampaign(campaign) {
    const prompt = `Analyze and provide optimization suggestions for this marketing campaign.

Campaign Details:
Name: ${campaign.name}
Type: ${campaign.type}
Budget: ${campaign.budget?.total} SAR
Channels: ${campaign.channels?.map(c => c.type).join(', ')}
Performance: ${JSON.stringify(campaign.performance || {})}

Provide optimization in JSON format:
{
  "performanceAnalysis": "overall performance analysis",
  "strengths": ["what's working well"],
  "weaknesses": ["what needs improvement"],
  "budgetRecommendations": [
    {
      "channel": "channel name",
      "currentBudget": number,
      "recommendedBudget": number,
      "reasoning": "why adjust"
    }
  ],
  "contentSuggestions": ["content ideas"],
  "targetingImprovements": ["audience targeting suggestions"],
  "timingOptimization": "best times to post/run ads",
  "expectedImpact": "predicted improvement",
  "quickWins": ["immediate actions to take"]
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Analyze industry trends
   */
  async analyzeTrends(industry, region = 'Saudi Arabia') {
    const prompt = `Analyze current marketing trends in the ${industry} industry in ${region}.

Provide trend analysis in JSON format:
{
  "trendingTopics": [
    {
      "topic": "topic name",
      "relevance": "why it's relevant",
      "searchVolume": "high|medium|low",
      "contentIdeas": ["content suggestions"]
    }
  ],
  "competitorInsights": ["what competitors are doing"],
  "platformTrends": {
    "instagram": "what's trending",
    "linkedin": "what's trending",
    "twitter": "what's trending",
    "tiktok": "what's trending"
  },
  "contentFormats": ["trending formats: reels, carousels, etc"],
  "hashtags": ["trending hashtags"],
  "recommendations": ["action items"]
}`;

    const response = await this.generateContent(prompt, { temperature: 0.8 });
    return this.parseJSONResponse(response);
  }

  // ==================== SALES DEPARTMENT ====================

  /**
   * Score and qualify lead
   */
  async scoreLead(leadData) {
    const prompt = `Score this lead based on qualification criteria for a B2B software/marketing company in Saudi Arabia.

Lead Data:
Company: ${leadData.company}
Industry: ${leadData.industry}
Company Size: ${leadData.companySize}
Budget: ${leadData.budget}
Timeline: ${leadData.timeline}
Decision Maker: ${leadData.isDecisionMaker}
Engagement: ${JSON.stringify(leadData.engagement || {})}
Source: ${leadData.source}

Score in JSON format:
{
  "scores": {
    "demographic": number (0-25),
    "firmographic": number (0-25),
    "behavioral": number (0-25),
    "engagement": number (0-25),
    "total": number (0-100)
  },
  "grade": "A+|A|B|C|D",
  "conversionProbability": number (0-100),
  "factors": [
    {
      "factor": "factor name",
      "score": number,
      "weight": number,
      "explanation": "why this score"
    }
  ],
  "recommendedActions": ["next steps"],
  "bestContactTime": "recommended time to contact",
  "estimatedDealValue": number,
  "timeToConversion": "estimated time",
  "idealApproach": "how to approach this lead"
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Generate proposal content
   */
  async generateProposal(opportunity) {
    const prompt = `Generate a professional proposal for this opportunity.

Opportunity:
Client: ${opportunity.client?.name}
Industry: ${opportunity.client?.industry}
Project: ${opportunity.projectScope}
Budget: ${opportunity.budget} SAR
Timeline: ${opportunity.timeline}
Requirements: ${JSON.stringify(opportunity.requirements || [])}

Generate proposal in JSON format (bilingual):
{
  "executiveSummary": {
    "ar": "ملخص تنفيذي بالعربية",
    "en": "Executive summary in English"
  },
  "problemStatement": {
    "ar": "وصف المشكلة",
    "en": "Problem description"
  },
  "proposedSolution": {
    "ar": "الحل المقترح",
    "en": "Proposed solution"
  },
  "valueProposition": {
    "ar": "القيمة المضافة",
    "en": "Value proposition"
  },
  "whyUs": {
    "ar": "لماذا نحن",
    "en": "Why choose us"
  },
  "deliverables": [
    {"ar": "منتج 1", "en": "Deliverable 1"}
  ],
  "timeline": {
    "phases": [
      {
        "name": {"ar": "المرحلة", "en": "Phase"},
        "duration": "duration",
        "deliverables": ["items"]
      }
    ]
  },
  "team": [
    {
      "role": {"ar": "الدور", "en": "Role"},
      "experience": "years",
      "responsibilities": {"ar": "المسؤوليات", "en": "Responsibilities"}
    }
  ],
  "pricing": {
    "breakdown": [
      {
        "item": {"ar": "بند", "en": "Item"},
        "cost": number
      }
    ]
  },
  "riskMitigation": {
    "ar": "استراتيجية إدارة المخاطر",
    "en": "Risk mitigation strategy"
  },
  "nextSteps": {
    "ar": "الخطوات التالية",
    "en": "Next steps"
  }
}`;

    const response = await this.generateContent(prompt, { temperature: 0.7, maxOutputTokens: 12000 });
    return this.parseJSONResponse(response);
  }

  /**
   * Predict deal closure probability
   */
  async predictDealClosure(opportunity) {
    const prompt = `Predict the probability of closing this deal.

Opportunity:
Stage: ${opportunity.stage}
Value: ${opportunity.value} SAR
Age: ${opportunity.age} days
Interactions: ${opportunity.interactions}
Decision Makers Engaged: ${opportunity.decisionMakersEngaged}
Competitors: ${opportunity.competitors?.length || 0}
Budget Confirmed: ${opportunity.budgetConfirmed}
Timeline: ${opportunity.timeline}

Predict in JSON format:
{
  "closureProbability": number (0-100),
  "confidence": number (0-100),
  "predictedCloseDate": "estimated date",
  "factors": {
    "positive": ["positive indicators"],
    "negative": ["concerns or blockers"],
    "neutral": ["neutral factors"]
  },
  "recommendations": ["actions to increase probability"],
  "risks": ["deal risks"],
  "nextBestAction": "most important next step",
  "dealVelocity": "fast|normal|slow",
  "competitorThreat": "low|medium|high"
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  // ==================== ACCOUNTING DEPARTMENT ====================

  /**
   * Predict cash flow
   */
  async predictCashFlow(historicalData, upcomingInvoices = [], upcomingExpenses = []) {
    const prompt = `Predict cash flow for the next 3 months.

Historical Data (last 6 months):
${JSON.stringify(historicalData)}

Upcoming Invoices:
${JSON.stringify(upcomingInvoices)}

Upcoming Expenses:
${JSON.stringify(upcomingExpenses)}

Predict in JSON format:
{
  "predictions": [
    {
      "month": "month name",
      "projectedInflows": number,
      "projectedOutflows": number,
      "netCashFlow": number,
      "closingBalance": number,
      "confidence": number (0-100)
    }
  ],
  "riskFactors": ["potential issues"],
  "recommendations": ["financial recommendations"],
  "cashShortfallRisk": boolean,
  "shortfallMonths": ["months with potential shortfall"],
  "suggestedActions": ["what to do"],
  "opportunityHighlights": ["positive opportunities"]
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Categorize expense automatically
   */
  async categorizeExpense(expenseData) {
    const prompt = `Categorize this expense for accounting purposes.

Expense:
Description: ${expenseData.description}
Amount: ${expenseData.amount} SAR
Merchant: ${expenseData.merchant}
Date: ${expenseData.date}

Categorize in JSON format:
{
  "category": "travel|marketing|office-supplies|software|hardware|professional-services|rent|utilities|salaries|other",
  "subcategory": "specific subcategory",
  "confidence": number (0-100),
  "taxDeductible": boolean,
  "vatRecoverable": boolean,
  "requiresApproval": boolean,
  "suggestedAccount": "account code",
  "reasoning": "why this category",
  "tags": ["relevant tags"]
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Forecast revenue based on pipeline
   */
  async forecastRevenue(projects, opportunities) {
    const prompt = `Forecast revenue for the next quarter.

Active Projects:
${JSON.stringify(projects)}

Pipeline Opportunities:
${JSON.stringify(opportunities)}

Forecast in JSON format:
{
  "quarterlyForecast": {
    "month1": number,
    "month2": number,
    "month3": number,
    "total": number
  },
  "confidence": number (0-100),
  "breakdown": {
    "existingProjects": number,
    "newDeals": number,
    "recurring": number
  },
  "scenarios": {
    "optimistic": number,
    "realistic": number,
    "pessimistic": number
  },
  "assumptions": ["key assumptions made"],
  "risks": ["revenue risks"],
  "recommendations": ["strategic recommendations"]
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  // ==================== HR DEPARTMENT ====================

  /**
   * Suggest resource reallocation
   */
  async suggestResourceReallocation(capacityData) {
    const prompt = `Analyze team capacity and suggest resource reallocation.

Capacity Data:
${JSON.stringify(capacityData)}

Suggest in JSON format:
{
  "overloadedEmployees": [
    {
      "employee": "name or id",
      "currentLoad": number,
      "capacity": number,
      "overloadPercentage": number,
      "projects": ["project list"],
      "suggestion": "what to do"
    }
  ],
  "underutilizedEmployees": [
    {
      "employee": "name or id",
      "currentLoad": number,
      "capacity": number,
      "availableCapacity": number,
      "skills": ["skill list"],
      "canTakeOn": ["suitable projects"]
    }
  ],
  "reallocationSuggestions": [
    {
      "employee": "name or id",
      "fromProject": "project name",
      "toProject": "project name",
      "hours": number,
      "reasoning": "why this move",
      "impact": "expected impact",
      "priority": "high|medium|low"
    }
  ],
  "hiringRecommendations": [
    {
      "role": "role needed",
      "reason": "why needed",
      "urgency": "immediate|soon|future",
      "skills": ["required skills"]
    }
  ],
  "trainingRecommendations": ["skill gaps to address"]
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Analyze feedback sentiment
   */
  async analyzeFeedbackSentiment(feedbackArray) {
    const prompt = `Analyze the sentiment and extract insights from this employee feedback.

Feedback:
${JSON.stringify(feedbackArray)}

Analyze in JSON format:
{
  "overallSentiment": "positive|neutral|negative",
  "sentimentScore": number (-100 to 100),
  "themes": [
    {
      "theme": "theme name",
      "sentiment": "positive|neutral|negative",
      "frequency": number,
      "examples": ["feedback examples"]
    }
  ],
  "strengths": ["employee strengths identified"],
  "areasForImprovement": ["areas needing work"],
  "motivationLevel": "high|medium|low",
  "engagementLevel": "high|medium|low",
  "careerPathSuggestions": ["career development ideas"],
  "trainingRecommendations": ["training needs"],
  "retentionRisk": "low|medium|high",
  "actionItems": ["management action items"]
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Predict employee attrition risk
   */
  async predictAttrition(employeeData) {
    const prompt = `Predict the attrition risk for this employee.

Employee Data:
Tenure: ${employeeData.tenure} months
Performance: ${employeeData.performance}
Last Promotion: ${employeeData.lastPromotion} months ago
Salary vs Market: ${employeeData.salaryVsMarket}
Engagement Score: ${employeeData.engagementScore}
Recent Feedback: ${JSON.stringify(employeeData.feedback || [])}
Workload: ${employeeData.workload}

Predict in JSON format:
{
  "attritionRisk": "low|medium|high|critical",
  "probability": number (0-100),
  "riskFactors": [
    {
      "factor": "factor name",
      "impact": "high|medium|low",
      "description": "explanation"
    }
  ],
  "warningSign": ["indicators to watch"],
  "retentionStrategies": ["actions to retain"],
  "urgency": "immediate|soon|monitor",
  "costOfReplacement": "estimated cost",
  "recommendations": ["specific actions to take"]
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  // ==================== CEO DASHBOARD ====================

  /**
   * Generate daily executive summary
   */
  async generateDailySummary(dashboardData) {
    const prompt = `Generate an executive daily summary for the CEO.

Today's Data:
${JSON.stringify(dashboardData, null, 2)}

Generate summary in JSON format (bilingual):
{
  "summary": {
    "ar": "ملخص تنفيذي بالعربية",
    "en": "Executive summary in English"
  },
  "keyMetrics": [
    {
      "metric": {"ar": "المقياس", "en": "Metric"},
      "value": "value",
      "change": "vs yesterday/last week",
      "trend": "up|down|stable",
      "significance": "high|medium|low"
    }
  ],
  "topWins": {
    "ar": ["إنجاز 1", "إنجاز 2"],
    "en": ["Win 1", "Win 2"]
  },
  "topConcerns": {
    "ar": ["قلق 1", "قلق 2"],
    "en": ["Concern 1", "Concern 2"]
  },
  "actionRequired": {
    "ar": ["إجراء مطلوب 1"],
    "en": ["Action required 1"]
  },
  "opportunities": {
    "ar": ["فرصة 1"],
    "en": ["Opportunity 1"]
  },
  "predictions": {
    "ar": ["توقع 1"],
    "en": ["Prediction 1"]
  }
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Generate early warnings
   */
  async generateEarlyWarnings(metrics) {
    const prompt = `Analyze these business metrics and identify early warnings.

Metrics:
${JSON.stringify(metrics, null, 2)}

Generate warnings in JSON format:
{
  "warnings": [
    {
      "type": "budget|performance|delivery|quality|hr|client",
      "severity": "info|warning|critical",
      "title": {"ar": "عنوان", "en": "Title"},
      "description": {"ar": "وصف", "en": "Description"},
      "affectedArea": "area affected",
      "metrics": {
        "current": number,
        "expected": number,
        "variance": number
      },
      "trend": "worsening|stable|improving",
      "recommendations": {
        "ar": ["توصية 1"],
        "en": ["Recommendation 1"]
      },
      "urgency": "immediate|high|medium|low"
    }
  ],
  "overallHealthScore": number (0-100),
  "immediateActionsNeeded": number
}`;

    const response = await this.generateContent(prompt);
    return this.parseJSONResponse(response);
  }

  /**
   * Predict business metrics
   */
  async predictBusinessMetrics(historicalData, timeframe = '3-months') {
    const prompt = `Predict key business metrics for the next ${timeframe}.

Historical Data:
${JSON.stringify(historicalData, null, 2)}

Predict in JSON format:
{
  "predictions": {
    "revenue": {
      "predicted": number,
      "confidence": number,
      "trend": "up|down|stable",
      "scenarios": {
        "optimistic": number,
        "realistic": number,
        "pessimistic": number
      }
    },
    "profitability": {
      "predicted": number,
      "confidence": number,
      "margin": number
    },
    "clientChurn": {
      "predicted": number,
      "confidence": number,
      "atRiskClients": ["list"]
    },
    "deliveryEfficiency": {
      "predicted": number,
      "confidence": number,
      "bottlenecks": ["potential issues"]
    }
  },
  "factors": ["key factors influencing predictions"],
  "risks": ["business risks"],
  "opportunities": ["growth opportunities"],
  "strategicRecommendations": ["long-term recommendations"]
}`;

    const response = await this.generateContent(prompt, { maxOutputTokens: 12000 });
    return this.parseJSONResponse(response);
  }
}

module.exports = new AIService();
