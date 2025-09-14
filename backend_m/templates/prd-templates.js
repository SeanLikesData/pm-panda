const prdTemplates = {
  lean: {
    name: 'Lean PRD',
    description: 'Minimalist approach focusing on problem, solution, and metrics',
    sections: {
      problem: {
        title: 'Problem Statement',
        required: true,
        content: '',
        prompts: [
          'What specific problem are we solving?',
          'Who experiences this problem?',
          'What is the impact of not solving it?',
          'How do we know this is a real problem?'
        ]
      },
      solution: {
        title: 'Proposed Solution',
        required: true,
        content: '',
        prompts: [
          'What is our hypothesis?',
          'What is the minimal solution?',
          'What are we explicitly NOT doing?'
        ]
      },
      metrics: {
        title: 'Success Metrics',
        required: true,
        content: '',
        prompts: [
          'How will we measure success?',
          'What is our target metric?',
          'When will we evaluate results?'
        ]
      },
      risks: {
        title: 'Risks & Assumptions',
        required: true,
        content: '',
        prompts: [
          'What could go wrong?',
          'What are we assuming to be true?',
          'What dependencies exist?'
        ]
      }
    }
  },

  agile: {
    name: 'Agile/Scrum PRD',
    description: 'User story focused with acceptance criteria and sprint planning',
    sections: {
      vision: {
        title: 'Product Vision',
        required: true,
        content: '',
        prompts: [
          'What is the product vision?',
          'How does this align with company goals?'
        ]
      },
      epics: {
        title: 'Epics',
        required: true,
        content: '',
        prompts: [
          'What are the major feature sets?',
          'How do epics relate to each other?'
        ]
      },
      userStories: {
        title: 'User Stories',
        required: true,
        content: '',
        template: 'As a [user type], I want [functionality] so that [benefit]',
        prompts: [
          'Who is the user?',
          'What do they want to do?',
          'Why do they want to do it?'
        ]
      },
      acceptanceCriteria: {
        title: 'Acceptance Criteria',
        required: true,
        content: '',
        template: 'Given [context], When [action], Then [outcome]',
        prompts: [
          'What defines "done"?',
          'What are the test scenarios?',
          'What are the edge cases?'
        ]
      },
      sprintPlan: {
        title: 'Sprint Planning',
        required: false,
        content: '',
        prompts: [
          'What goes in Sprint 1?',
          'What is the velocity?',
          'What are the sprint goals?'
        ]
      },
      backlog: {
        title: 'Product Backlog',
        required: true,
        content: '',
        prompts: [
          'What is prioritized?',
          'What is deferred?',
          'What needs refinement?'
        ]
      }
    }
  },

  enterprise: {
    name: 'Enterprise PRD',
    description: 'Comprehensive documentation for large-scale products',
    sections: {
      executiveSummary: {
        title: 'Executive Summary',
        required: true,
        content: '',
        prompts: [
          'What is the business case?',
          'What is the expected ROI?',
          'What are the strategic benefits?'
        ]
      },
      marketAnalysis: {
        title: 'Market Analysis',
        required: true,
        content: '',
        prompts: [
          'What is the market size?',
          'Who are the competitors?',
          'What is our differentiation?',
          'What are the market trends?'
        ]
      },
      stakeholders: {
        title: 'Stakeholder Analysis',
        required: true,
        content: '',
        prompts: [
          'Who are the stakeholders?',
          'What are their interests?',
          'How will they be impacted?',
          'What is their influence level?'
        ]
      },
      requirements: {
        title: 'Detailed Requirements',
        required: true,
        content: '',
        subsections: {
          functional: 'Functional Requirements',
          nonFunctional: 'Non-Functional Requirements',
          regulatory: 'Regulatory & Compliance',
          security: 'Security Requirements'
        }
      },
      architecture: {
        title: 'Solution Architecture',
        required: true,
        content: '',
        prompts: [
          'What is the high-level architecture?',
          'What are the system components?',
          'What are the integration points?',
          'What are the data flows?'
        ]
      },
      implementation: {
        title: 'Implementation Plan',
        required: true,
        content: '',
        prompts: [
          'What are the phases?',
          'What are the milestones?',
          'What are the deliverables?',
          'What is the resource plan?'
        ]
      },
      riskManagement: {
        title: 'Risk Management',
        required: true,
        content: '',
        prompts: [
          'What are the identified risks?',
          'What is the impact and probability?',
          'What are the mitigation strategies?',
          'What are the contingency plans?'
        ]
      },
      costBenefit: {
        title: 'Cost-Benefit Analysis',
        required: true,
        content: '',
        prompts: [
          'What are the development costs?',
          'What are the operational costs?',
          'What are the expected benefits?',
          'What is the payback period?'
        ]
      }
    }
  },

  startup: {
    name: 'Startup PRD',
    description: 'Fast-paced, hypothesis-driven for rapid iteration',
    sections: {
      hypothesis: {
        title: 'Core Hypothesis',
        required: true,
        content: '',
        prompts: [
          'What do we believe to be true?',
          'How will we validate this?',
          'What will prove us wrong?'
        ]
      },
      customerProblem: {
        title: 'Customer Problem',
        required: true,
        content: '',
        prompts: [
          'What job are customers trying to do?',
          'What pain points do they have?',
          'How are they solving it today?',
          'Why is existing solution inadequate?'
        ]
      },
      mvp: {
        title: 'MVP Definition',
        required: true,
        content: '',
        prompts: [
          'What is the absolute minimum feature set?',
          'What can we ship in 2 weeks?',
          'What will we learn from this?'
        ]
      },
      experiments: {
        title: 'Experiments & Learning',
        required: true,
        content: '',
        prompts: [
          'What experiments will we run?',
          'What are we trying to learn?',
          'How will we measure results?',
          'What are the success criteria?'
        ]
      },
      pivotCriteria: {
        title: 'Pivot Criteria',
        required: true,
        content: '',
        prompts: [
          'When would we pivot?',
          'What signals indicate failure?',
          'What are alternative approaches?'
        ]
      },
      growthStrategy: {
        title: 'Growth Strategy',
        required: false,
        content: '',
        prompts: [
          'How will we acquire first 100 users?',
          'What is our viral loop?',
          'What are the growth channels?'
        ]
      }
    }
  },

  technical: {
    name: 'Technical PRD',
    description: 'Engineering-focused with technical specifications',
    sections: {
      technicalOverview: {
        title: 'Technical Overview',
        required: true,
        content: '',
        prompts: [
          'What is the technical challenge?',
          'What is the proposed approach?',
          'What are the alternatives considered?'
        ]
      },
      systemDesign: {
        title: 'System Design',
        required: true,
        content: '',
        prompts: [
          'What are the components?',
          'How do they interact?',
          'What are the data models?',
          'What are the APIs?'
        ]
      },
      performance: {
        title: 'Performance Requirements',
        required: true,
        content: '',
        prompts: [
          'What are the latency requirements?',
          'What is the expected load?',
          'What are the scalability needs?',
          'What are the SLAs?'
        ]
      },
      infrastructure: {
        title: 'Infrastructure',
        required: true,
        content: '',
        prompts: [
          'What cloud services are needed?',
          'What is the deployment architecture?',
          'What are the monitoring requirements?',
          'What is the disaster recovery plan?'
        ]
      },
      security: {
        title: 'Security Considerations',
        required: true,
        content: '',
        prompts: [
          'What are the authentication requirements?',
          'What data needs encryption?',
          'What are the compliance requirements?',
          'What are the security threats?'
        ]
      },
      testing: {
        title: 'Testing Strategy',
        required: true,
        content: '',
        prompts: [
          'What is the test coverage target?',
          'What types of testing are needed?',
          'What is the QA process?',
          'What are the acceptance tests?'
        ]
      },
      migration: {
        title: 'Migration Plan',
        required: false,
        content: '',
        prompts: [
          'How will we migrate existing data?',
          'What is the rollback plan?',
          'How do we ensure zero downtime?'
        ]
      }
    }
  },

  amazon: {
    name: 'Amazon Working Backwards PRD',
    description: 'Start with press release and work backwards',
    sections: {
      pressRelease: {
        title: 'Press Release',
        required: true,
        content: '',
        prompts: [
          'What would the press release say?',
          'What is the headline?',
          'What customer quote would we include?',
          'What company quote would we add?'
        ]
      },
      faq: {
        title: 'FAQ',
        required: true,
        content: '',
        prompts: [
          'What will customers ask?',
          'What will internal teams ask?',
          'What are the hard questions?',
          'What are we not explaining well?'
        ]
      },
      customerExperience: {
        title: 'Customer Experience',
        required: true,
        content: '',
        prompts: [
          'What is the customer journey?',
          'What are the touchpoints?',
          'What delights customers?',
          'What might frustrate them?'
        ]
      },
      workingBackwards: {
        title: 'Working Backwards',
        required: true,
        content: '',
        prompts: [
          'What needs to be true for the press release?',
          'What capabilities do we need?',
          'What dependencies exist?',
          'What is the sequence of delivery?'
        ]
      },
      tenets: {
        title: 'Tenets',
        required: true,
        content: '',
        prompts: [
          'What principles guide decisions?',
          'What trade-offs are we making?',
          'What are we optimizing for?'
        ]
      }
    }
  }
};

module.exports = { prdTemplates };