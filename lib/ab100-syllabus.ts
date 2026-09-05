import type { DomainId, SyllabusDomain } from "./questions";

/**
 * The published AB-100 "Skills measured" outline (as of July 22, 2026), for
 * Exam AB-100: Agentic AI Business Solutions Architect.
 *
 * AB-100 questions cite these bullets verbatim; the question-bank audit fails if a
 * citation does not match an entry here, so references cannot drift.
 * Source: https://learn.microsoft.com/credentials/certifications/resources/study-guides/ab-100
 */
export const AB100_SYLLABUS: SyllabusDomain[] = [
  {
    id: "ab-plan" as DomainId,
    domain: "Plan AI-powered business solutions (25–30%)",
    skills: [
      {
        skill: "Analyze requirements for AI-powered business solutions",
        bullets: [
          "Assess the use of agents in task automation, data analytics, and decision-making",
          "Review data for grounding, including accuracy, relevance, timeliness, cleanliness, and availability",
          "Organize business solution data to be available for other AI systems",
        ],
      },
      {
        skill: "Design overall AI strategy for business solutions",
        bullets: [
          "Implement the AI adoption process from the Cloud Adoption Framework for Azure",
          "Design the strategy for building AI and agents in business solutions",
          "Design a multi-agent solution by using platforms such as Microsoft 365 Copilot, Copilot Studio, and Microsoft Foundry",
          "Develop the use cases for prebuilt agents in the solution",
          "Define the solution rules and constraints when building AI components with Copilot Studio, Microsoft Foundry and Foundry Tools",
          "Determine the use of generative AI and knowledge sources in agents built with Copilot Studio",
          "Determine when to build custom agents or extend Microsoft 365 Copilot",
          "Determine when custom AI models should be created",
          "Provide guidelines for creating a prompt library",
          "Develop the use cases for customized small language models for the solution",
          "Provide prompt engineering guidelines and techniques for AI-powered business solutions",
          "Include the elements of the Microsoft AI Center of Excellence",
          "Design AI solutions that use multiple Dynamics 365 apps",
        ],
      },
      {
        skill: "Evaluate the costs and benefits of an AI-powered business solution",
        bullets: [
          "Select ROI criteria for AI-powered business solutions, including the total cost of ownership",
          "Create an ROI analysis for the proposed AI solution for a business process",
          "Analyze whether to build, buy, or extend AI components for business solutions",
          "Implement a model router to intelligently route requests to the most suitable model",
        ],
      },
    ],
  },
  {
    id: "ab-design" as DomainId,
    domain: "Design AI-powered business solutions (25–30%)",
    skills: [
      {
        skill: "Design AI and agents for business solutions",
        bullets: [
          "Design business terms for Copilot in Dynamics 365 apps for customer experience and service",
          "Design customizations of Copilot in Dynamics 365 apps for customer experience and service",
          "Design connectors for Copilot in Dynamics 365 Sales",
          "Design agents for integration with Dynamics 365 Contact Center channels",
          "Design task agents",
          "Design autonomous agents",
          "Design prompt and response agents",
          "Propose Foundry Tools for a given requirement",
          "Propose code-first generative pages and the use of an agent feed for apps",
          "Design topics for Copilot Studio, including fallback",
          "Design data processing for AI models and grounding",
          "Design a business process to include AI components in a Power Apps canvas app",
          "Apply the Microsoft Power Platform Well-Architected Framework to intelligent application workloads",
          "Determine when to use standard natural language processing, conversational language understanding, or generative AI orchestration in Copilot Studio",
          "Design agents and agent flows with Copilot Studio",
          "Design prompt actions in Copilot Studio",
        ],
      },
      {
        skill: "Design extensibility of AI solutions",
        bullets: [
          "Design AI solutions by using custom models in Microsoft Foundry",
          "Design agents in Microsoft 365 Copilot",
          "Design agent extensibility in Copilot Studio",
          "Design agent extensibility with Model Context Protocol in Copilot Studio",
          "Design agents to automate tasks in apps and websites by using Computer Use in Copilot Studio",
          "Design agent behaviors in Copilot Studio, including reasoning and voice mode",
          "Optimize solution design by using agents in Microsoft 365, including Teams and SharePoint",
        ],
      },
      {
        skill: "Orchestrate configuration for prebuilt agents and apps",
        bullets: [
          "Orchestrate AI features in Dynamics 365 apps for finance and supply chain",
          "Orchestrate AI features in Dynamics 365 apps for customer experience and service",
          "Propose Microsoft 365 agents for business scenarios",
          "Orchestrate the configuration of Microsoft 365 Copilot for Sales and Microsoft 365 Copilot for Service",
          "Propose Microsoft Power Platform AI features, including AI hub",
          "Design interoperability of the finance and operations agent chats to use additional knowledge sources",
          "Recommend the process of adding knowledge sources to in-app help and guidance for Dynamics 365 Finance or Dynamics 365 Supply Chain Management apps",
        ],
      },
    ],
  },
  {
    id: "ab-deploy" as DomainId,
    domain: "Deploy AI-powered business solutions (40–45%)",
    skills: [
      {
        skill: "Analyze, monitor, and tune AI-powered business solutions",
        bullets: [
          "Recommend the process and tools required for monitoring agents",
          "Analyze backlog and user feedback of AI and agent usage",
          "Apply AI-based tools to analyze and identify issues and perform tuning",
          "Monitor agent performance and metrics",
          "Interpret telemetry data for performance and model tuning",
        ],
      },
      {
        skill: "Manage the testing of AI-powered business solutions",
        bullets: [
          "Recommend the process and metrics to test agents",
          "Create validation criteria of custom AI models",
          "Validate effective Copilot prompt best practices",
          "Design end-to-end test scenarios of AI solutions that use multiple Dynamics 365 apps",
          "Build the strategy for creating test cases by using Copilot",
        ],
      },
      {
        skill: "Design the ALM process for AI-powered business solutions",
        bullets: [
          "Design the ALM process for data used in AI models and agents",
          "Design the ALM process for Copilot Studio agents, connectors, and actions",
          "Design the ALM process for Microsoft Foundry Agents service",
          "Design the ALM process for custom AI models",
          "Design the ALM process for AI in Dynamics 365 apps for finance and supply chain",
          "Design the ALM process for AI in Dynamics 365 apps for customer experience and service",
        ],
      },
      {
        skill: "Design responsible AI, security, governance, risk management, and compliance",
        bullets: [
          "Design security for agents",
          "Design governance for agents",
          "Design model security",
          "Analyze solution and AI vulnerabilities and mitigations, including prompt manipulation",
          "Review solution for adherence to responsible AI principles",
          "Validate data residency and movement compliance",
          "Design access controls on grounding data and model tuning",
          "Design audit trails for changes to models and data",
        ],
      },
    ],
  },
];

export const AB100_STUDY_GUIDE_URL = "https://learn.microsoft.com/credentials/certifications/resources/study-guides/ab-100";

/** Every bullet in the outline, for O(1) citation validation. */
export const AB100_BULLETS: ReadonlySet<string> = new Set(
  AB100_SYLLABUS.flatMap((domain) => domain.skills.flatMap((skill) => skill.bullets)),
);
