const prdTemplate = {
  basic: {
    title: "Product Requirements Document",
    sections: {
      overview: {
        title: "Product Overview",
        content: "",
        prompts: [
          "What problem does this product solve?",
          "Who is the target audience?",
          "What is the product vision?"
        ]
      },
      objectives: {
        title: "Objectives & Goals",
        content: "",
        prompts: [
          "What are the key business objectives?",
          "What are the success metrics?",
          "What are the OKRs for this product?"
        ]
      },
      userStories: {
        title: "User Stories",
        content: "",
        template: "As a [user type], I want to [action] so that [benefit]",
        examples: []
      },
      requirements: {
        title: "Requirements",
        subsections: {
          functional: {
            title: "Functional Requirements",
            items: []
          },
          nonFunctional: {
            title: "Non-Functional Requirements",
            items: []
          },
          technical: {
            title: "Technical Requirements",
            items: []
          }
        }
      },
      scope: {
        title: "Scope",
        inScope: [],
        outOfScope: []
      },
      timeline: {
        title: "Timeline & Milestones",
        phases: []
      },
      risks: {
        title: "Risks & Mitigation",
        items: []
      }
    }
  },
  
  detailed: {
    title: "Comprehensive Product Requirements Document",
    metadata: {
      version: "1.0",
      status: "Draft",
      owner: "",
      reviewers: [],
      approvers: [],
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString()
    },
    sections: {
      executiveSummary: {
        title: "Executive Summary",
        content: "",
        maxLength: 500
      },
      productVision: {
        title: "Product Vision & Strategy",
        vision: "",
        mission: "",
        strategicAlignment: "",
        valueProposition: ""
      },
      marketAnalysis: {
        title: "Market Analysis",
        targetMarket: "",
        competitiveAnalysis: [],
        marketOpportunity: "",
        userPersonas: []
      },
      productRequirements: {
        title: "Product Requirements",
        epics: [],
        features: [],
        userStories: [],
        acceptanceCriteria: []
      },
      userExperience: {
        title: "User Experience",
        userFlows: [],
        wireframes: [],
        mockups: [],
        usabilityRequirements: []
      },
      technicalArchitecture: {
        title: "Technical Architecture",
        systemDesign: "",
        dataModel: "",
        apis: [],
        integrations: [],
        security: [],
        performance: []
      },
      deliveryPlan: {
        title: "Delivery Plan",
        phases: [],
        milestones: [],
        dependencies: [],
        resourceRequirements: []
      },
      successMetrics: {
        title: "Success Metrics & KPIs",
        businessMetrics: [],
        userMetrics: [],
        technicalMetrics: [],
        qualityMetrics: []
      },
      riskManagement: {
        title: "Risk Management",
        risks: [],
        mitigationStrategies: [],
        contingencyPlans: []
      },
      appendix: {
        title: "Appendix",
        glossary: [],
        references: [],
        assumptions: [],
        constraints: []
      }
    }
  },

  agile: {
    title: "Agile Product Requirements",
    sections: {
      productBacklog: {
        title: "Product Backlog",
        epics: [],
        themes: [],
        initiatives: []
      },
      userStoryMap: {
        title: "User Story Map",
        activities: [],
        tasks: [],
        releases: []
      },
      acceptanceCriteria: {
        title: "Acceptance Criteria",
        definitionOfDone: [],
        definitionOfReady: []
      },
      sprintGoals: {
        title: "Sprint Goals",
        upcomingSprints: []
      }
    }
  }
};

const generatePRD = (type = 'basic', customData = {}) => {
  const template = prdTemplate[type] || prdTemplate.basic;
  
  return {
    ...template,
    generatedAt: new Date().toISOString(),
    customData,
    inkeepEnabled: true,
    aiSuggestions: []
  };
};

const prdPrompts = {
  overview: [
    "Describe the problem this product solves",
    "Who are the primary users?",
    "What is the unique value proposition?",
    "How does this align with company goals?"
  ],
  requirements: [
    "List the must-have features",
    "What are the nice-to-have features?",
    "Define the minimum viable product (MVP)",
    "What are the technical constraints?"
  ],
  success: [
    "How will you measure success?",
    "What are the key performance indicators?",
    "What is the target adoption rate?",
    "Define the success criteria"
  ]
};

module.exports = {
  prdTemplate,
  generatePRD,
  prdPrompts
};