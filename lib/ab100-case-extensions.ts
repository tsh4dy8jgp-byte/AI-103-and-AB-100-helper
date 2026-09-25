import { AB100_SYLLABUS } from "./ab100-syllabus.ts";
import { buildersFor, citeFrom } from "./question-builders.ts";
import type { Question } from "./questions";

/**
 * MAINTAINED BY HAND. Extra questions for the twelve AB-100 case studies, so that each
 * case carries six to eight questions in a mix of formats, as on the real exam. Every
 * case gains at least one drag-and-drop and one dropdown item, and each item leans on
 * the case's audience or use cases. Architect-level: design judgment, not code.
 *
 * Authoring convention (see question-builders.ts): the right answer comes first.
 */
const { choose, match, sequence, gaps } = buildersFor("ab100");
const cite = citeFrom(AB100_SYLLABUS);

export const AB100_CASE_EXTENSIONS: Question[] = [
  // --- Contoso Manufacturing (7) ---
  match({
    id: "ab-c-mfg-05", caseStudyId: "ab-manufacturing", domain: "ab-plan", topic: "Use case to capability",
    prompt: "Match each Contoso Manufacturing use case to the Dynamics 365 capability or measure the architect should propose.",
    targets: [
      "A supplier moves a confirmed delivery date and a follow-up is needed",
      "A new buyer asks how to handle a partial receipt inside the app",
      "Finance must judge the programme before it expands",
    ],
    answers: [
      "The Procurement Agent's supplier communications features",
      "In-app help grounded in Contoso's own procedures",
      "A baseline of buyer hours measured before go-live",
    ],
    distractors: ["A custom Foundry agent that rebuilds supplier follow-up", "A count of Copilot prompts sent each month"],
    explanation: "The Procurement Agent in Supply Chain Management already drafts supplier follow-ups and reads vendor change emails, so the small team adopts it instead of rebuilding it in Foundry. New buyers get answers through in-app help that uses Contoso's procedures as a knowledge source. A defensible return needs a pre-launch baseline of hours; a count of prompts measures activity, not value.",
    syllabus: cite("Develop the use cases for prebuilt agents in the solution", "https://learn.microsoft.com/dynamics365/supply-chain/procurement/procurement-agent-overview", "Procurement Agent overview"),
  }),
  gaps({
    id: "ab-c-mfg-06", caseStudyId: "ab-manufacturing", domain: "ab-plan", topic: "Programme return",
    prompt: "Contoso's CFO will decide on expansion from the first two quarters' results. Complete the architect's ROI method for the agent solution.",
    template: "Measure the {0} of supplier follow-up before go-live, value the hours saved at the {1}, and subtract the {2} to report the net annual return.",
    blanks: [
      ["baseline hours per week", "number of agents deployed", "count of Copilot prompts"],
      ["fully loaded cost per buyer hour", "average supplier invoice value", "list price of a Copilot license"],
      ["platform, build, and running costs", "cost of the ERP system", "value of purchase orders processed"],
    ],
    explanation: "Return is measured against a baseline taken before go-live, benefits are valued at the fully loaded cost of the hours saved, and the total cost of the platform, build, and ongoing operation is subtracted. Agent and prompt counts measure activity, invoice and purchase-order values are not benefits of this automation, and the ERP system's cost exists with or without the programme.",
    syllabus: cite("Create an ROI analysis for the proposed AI solution for a business process", "https://learn.microsoft.com/azure/foundry/concepts/manage-costs", "Plan and manage costs for Microsoft Foundry"),
  }),
  choose({
    id: "ab-c-mfg-07", caseStudyId: "ab-manufacturing", domain: "ab-deploy", topic: "Auditable automation",
    prompt: "Contoso's automation must leave an auditable record of every purchase order change, and procurement staff cannot hold administrator access to production. Which two design elements meet both constraints? Each correct answer presents part of the solution.",
    options: [
      "Run the agent under its own identity with least-privilege roles",
      "Turn on database logging for the purchase order fields it updates",
      "Give each buyer the System administrator role in production",
      "Keep a manual spreadsheet of the changes that buyers approve",
      "Let the agent act under the architect's personal account",
    ],
    explanation: "A dedicated agent identity with narrow roles separates what the automation can do from what people can do, and database logging records each field change against that identity. Giving buyers System administrator breaks the access constraint, a manual spreadsheet is not a dependable audit trail, and a personal account hides which changes the automation made.",
    syllabus: cite("Design audit trails for changes to models and data", "https://learn.microsoft.com/purview/ai-microsoft-purview", "Microsoft Purview for AI"),
  }),

  // --- Fabrikam Insurance (6) ---
  match({
    id: "ab-c-ins-05", caseStudyId: "ab-insurance", domain: "ab-design", topic: "Copilot features for representatives",
    prompt: "Match each Fabrikam representative need to the Copilot capability in Dynamics 365 Customer Service that meets it.",
    targets: [
      "A reliable summary at the end of a 25-minute call",
      "An answer to a cover question during a live chat",
      "A follow-up email to the policyholder after the call",
    ],
    answers: ["Conversation summary", "Ask a question grounded in the knowledge articles", "Email drafting"],
    distractors: ["Unified routing rules", "Automatic knowledge article publishing"],
    explanation: "Copilot summarizes conversations for the representative to review, answers questions from the curated knowledge base, and drafts emails that the representative edits and sends. Unified routing assigns work to queues, and publishing articles automatically would bypass the library's curation.",
    syllabus: cite("Design customizations of Copilot in Dynamics 365 apps for customer experience and service", "https://learn.microsoft.com/dynamics365/customer-service/administer/configure-copilot-features", "Configure Copilot features in Customer Service"),
  }),
  gaps({
    id: "ab-c-ins-06", caseStudyId: "ab-insurance", domain: "ab-plan", topic: "Sources for each question",
    prompt: "Complete the Fabrikam design for the Copilot Studio agent that serves policyholders.",
    template: "Ground cover questions in {0} filtered to the caller's products, answer claim status through {1} that calls the claims platform, and leave {2} with the representative for anything that changes a claim.",
    blanks: [
      ["the curated knowledge articles", "the public website", "the model's general knowledge"],
      ["a tool", "a knowledge source", "a system topic"],
      ["the decision", "the transcript", "the summary"],
    ],
    explanation: "Cover questions come from the curated articles, filtered so callers see only their own products. Live claim status is data, not documentation, so a tool calls the claims platform; a knowledge source would return stale text, and a system topic only handles conversation flow. Decisions affecting a claim stay with the representative, while transcripts and summaries are just records.",
    syllabus: cite("Determine the use of generative AI and knowledge sources in agents built with Copilot Studio", "https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio", "Knowledge sources in Copilot Studio"),
  }),

  // --- Northwind Retail (7) ---
  match({
    id: "ab-c-ret-05", caseStudyId: "ab-retail", domain: "ab-design", topic: "Copilot for each audience",
    prompt: "Match each Northwind audience to the Microsoft 365 Copilot configuration it needs.",
    targets: [
      "Field sellers working in Outlook and Teams",
      "Service agents handling escalations for the same customers",
      "The sales operations lead governing the rollout",
    ],
    answers: [
      "Microsoft 365 Copilot for Sales",
      "Microsoft 365 Copilot for Service",
      "Admin settings in the Microsoft 365 admin center",
    ],
    distractors: ["The Dynamics 365 Field Service mobile app", "A new standalone Power Pages site"],
    explanation: "Copilot for Sales brings CRM context into Outlook and Teams for sellers, Copilot for Service gives service agents the same customer context during escalations, and the rollout is governed from the Microsoft 365 admin center with existing policies. The Field Service mobile app serves technicians, and a new Power Pages site would be a new application that sellers were promised they would not have to learn.",
    syllabus: cite("Orchestrate the configuration of Microsoft 365 Copilot for Sales and Microsoft 365 Copilot for Service", "https://learn.microsoft.com/microsoft-sales-copilot/introduction", "Microsoft 365 Copilot for Sales"),
  }),
  gaps({
    id: "ab-c-ret-06", caseStudyId: "ab-retail", domain: "ab-deploy", topic: "Offline fallback telemetry",
    prompt: "Northwind's field sellers sometimes lose connectivity. Complete the design for the Copilot contract-status capability.",
    template: "When the contracts system cannot be reached, return {0} with its {1}, and count these replies in telemetry as {2} so the team can see how often sellers work from old data.",
    blanks: [
      ["the last synced status", "a generated best guess", "an empty response"],
      ["sync timestamp", "confidence score", "model version"],
      ["fallback responses", "successful lookups", "user errors"],
    ],
    explanation: "Returning the last synced status with its timestamp keeps sellers working while being honest about how old the data is, and counting those replies as fallbacks shows how often it happens. A generated guess invents a status, an empty reply blocks the seller, a confidence score or model version says nothing about staleness, and logging fallbacks as successes or user errors hides the problem.",
    syllabus: cite("Interpret telemetry data for performance and model tuning", "https://learn.microsoft.com/power-platform/well-architected/reliability/", "Well-Architected reliability pillar"),
  }),
  choose({
    id: "ab-c-ret-07", caseStudyId: "ab-retail", domain: "ab-deploy", topic: "Securing the portal agent",
    prompt: "Northwind's Copilot Studio computer-use agent signs in to the legacy contracts portal. Which two controls keep it within Northwind's governance requirements? Each correct answer presents part of the solution.",
    options: [
      "A dedicated portal account with read-only access for the agent",
      "The tenant's data policies applied to the agent's environment",
      "Reuse of a senior seller's personal portal login for the agent",
      "Freedom to browse any website that the seller could open",
      "The portal password written into the agent's instructions for reuse",
    ],
    explanation: "A dedicated, read-only account limits what the agent can do and keeps its actions attributable, and applying the tenant's data policies means the new surface inherits existing governance. Reusing a person's login mixes identities, unrestricted browsing widens the attack surface, and a password in the instructions is exposed to anyone who can read the agent.",
    syllabus: cite("Design security for agents", "https://learn.microsoft.com/microsoft-copilot-studio/security-and-governance", "Copilot Studio security and governance"),
  }),

  // --- Litware Health (8) ---
  sequence({
    id: "ab-c-hea-05", caseStudyId: "ab-health", domain: "ab-deploy", topic: "Changing the extraction model",
    prompt: "Litware must replace the model behind its Microsoft Foundry extraction agent while keeping every past decision traceable. Arrange the steps in order.",
    steps: [
      "Evaluate the new version against the approved referral test set",
      "Record the results and the approver with the model version",
      "Deploy the new version beside the current one and shift traffic gradually",
      "Retain the prior version so earlier decisions can be traced to it",
    ],
    distractors: ["Replace the model in place and delete the previous version", "Skip evaluation because the vendor already tested the model"],
    explanation: "Evaluation comes first so the change is justified, the results and approver are recorded against the version, traffic moves gradually so problems surface early, and the prior version is kept so an auditor can trace older decisions. Replacing in place destroys that trail, and a vendor's own testing does not show fitness for Litware's referrals.",
    syllabus: cite("Design the ALM process for custom AI models", "https://learn.microsoft.com/azure/foundry/concepts/built-in-evaluators", "Built-in evaluators reference"),
  }),
  gaps({
    id: "ab-c-hea-06", caseStudyId: "ab-health", domain: "ab-deploy", topic: "Grounding access",
    prompt: "Complete Litware's access design for its Copilot Studio and Microsoft Foundry agents.",
    template: "The staff agents in Teams use {0} so each answer is retrieved with the signed-in user's permissions, the extraction agent reads referrals through {1} scoped to its department, and access to the tuning dataset is limited to {2}.",
    blanks: [
      ["end-user authentication", "a shared maker connection", "anonymous access"],
      ["a managed identity", "a personal account", "a shared admin key"],
      ["named model owners", "all Teams users", "every maker in the tenant"],
    ],
    explanation: "End-user authentication makes retrieval run as the signed-in user, so staff see only referrals they can already open; a shared maker connection would expose everything the maker can read. The extraction agent uses a managed identity scoped to its department, never a personal account or a shared key, and tuning data is restricted to named model owners rather than all users or makers.",
    syllabus: cite("Design access controls on grounding data and model tuning", "https://learn.microsoft.com/power-platform/admin/wp-security-cds", "Dataverse security concepts"),
  }),
  choose({
    id: "ab-c-hea-07", caseStudyId: "ab-health", domain: "ab-plan", topic: "Human approval rules",
    prompt: "Clinical decisions at Litware cannot be automated without a named human approver. Which two rules should the architect write into the solution design? Each correct answer presents part of the solution.",
    options: [
      "The extraction agent may propose a triage category but never set it",
      "A named clinician's approval is recorded before any triage status changes",
      "The agent may approve routine triage when its confidence exceeds 95 percent",
      "Clinicians review a weekly sample of automatically applied triage decisions",
      "Approval becomes optional during periods of unusually high referral volume",
    ],
    explanation: "The agent proposes and a named clinician's recorded approval changes the status, so no clinical decision is automated. A confidence threshold, after-the-fact sampling, and optional approval under load all let decisions take effect without the required approver.",
    syllabus: cite("Define the solution rules and constraints when building AI components with Copilot Studio, Microsoft Foundry and Foundry Tools", "https://learn.microsoft.com/azure/cloud-adoption-framework/ai-agents/governance-security-across-organization", "Governance and security for AI agents"),
  }),
  match({
    id: "ab-c-hea-08", caseStudyId: "ab-health", domain: "ab-deploy", topic: "Residency checks",
    prompt: "Match each component of Litware's agent solution to what the architect must verify for the approved-geography requirement.",
    targets: ["Copilot Studio environment", "Microsoft Foundry model deployment", "Application Insights for the agents"],
    answers: [
      "The environment's region is inside the approved geography",
      "A deployment type that keeps processing in that geography",
      "The workspace region and any data export destinations",
    ],
    distractors: ["The staff members' browser language", "The Teams client version on each device"],
    explanation: "Residency depends on where each component stores and processes data: the environment's region, a deployment type that does not route processing globally, and the telemetry workspace together with anything it exports. Browser language and client versions have no bearing on where data is processed.",
    syllabus: cite("Validate data residency and movement compliance", "https://learn.microsoft.com/azure/cloud-adoption-framework/ai-agents/governance-security-across-organization", "Governance and security for AI agents"),
  }),

  // --- Adventure Works Logistics (7) ---
  sequence({
    id: "ab-c-log-05", caseStudyId: "ab-logistics", domain: "ab-deploy", topic: "Promoting the reconciliation",
    prompt: "Arrange the Adventure Works release steps for the overnight reconciliation agent flow and its prompt.",
    steps: [
      "Build the agent flow and prompt in an unmanaged solution in development",
      "Define environment variables and connection references for each stage",
      "Deploy the managed solution to test through a pipeline and validate it",
      "Promote the same managed solution to production through the pipeline",
    ],
    distractors: ["Edit the flow directly in production to match test", "Import an unmanaged export straight into production"],
    explanation: "Work is authored unmanaged in development, stage-specific endpoints and credentials are handled by environment variables and connection references, and the same managed solution moves through test to production by pipeline, so supervisors never need production access. Editing production directly and importing unmanaged solutions break repeatability and the ability to reverse a release.",
    syllabus: cite("Design the ALM process for Copilot Studio agents, connectors, and actions", "https://learn.microsoft.com/power-platform/alm/pipelines", "Pipelines in Power Platform"),
  }),
  gaps({
    id: "ab-c-log-06", caseStudyId: "ab-logistics", domain: "ab-design", topic: "Unattended portal submission",
    prompt: "Complete the Adventure Works design for submitting the daily supplier return.",
    template: "Submit the return with {0} in Copilot Studio, start it each morning with a {1}, and have it {2} when the portal's form layout changes.",
    blanks: [
      ["computer use", "a custom connector", "an HTTP request action"],
      ["scheduled trigger", "adaptive card", "system topic"],
      ["stop and alert the team", "guess the new field positions", "keep retrying without limit"],
    ],
    explanation: "The portal has a web form and no API, so computer use operates it as a person would; a custom connector or an HTTP request needs an interface the portal does not have. A scheduled trigger starts the agent with no one at the keyboard, whereas adaptive cards and system topics serve conversations. When the layout changes, the safe behavior is to stop and alert rather than guess or retry forever.",
    syllabus: cite("Design agents to automate tasks in apps and websites by using Computer Use in Copilot Studio", "https://learn.microsoft.com/microsoft-copilot-studio/computer-use", "Computer use in Copilot Studio"),
  }),
  choose({
    id: "ab-c-log-07", caseStudyId: "ab-logistics", domain: "ab-design", topic: "Supervisor review point",
    correctCount: 1,
    prompt: "Adventure Works supervisors must review each drafted exception summary before it is saved in Dataverse. Where should the canvas app design place that review?",
    options: [
      "In an editable field that the supervisor confirms and saves",
      "After an automatic save, through later edits by the supervisor",
      "In an email to the operations analyst for approval each morning",
      "After the overnight reconciliation has finished its full run",
      "In a Teams channel post where other supervisors can add comments",
    ],
    explanation: "Showing the draft in an editable field that the supervisor saves places the review before anything is written, inside the screen they already use. Saving first and editing later stores unreviewed text, routing drafts to the analyst or a Teams channel moves the decision away from the supervisor, and waiting for the overnight run delays the summary for no benefit.",
    syllabus: cite("Design a business process to include AI components in a Power Apps canvas app", "https://learn.microsoft.com/ai-builder/overview", "AI Builder overview"),
  }),

  // --- Woodgrove Bank (6) ---
  match({
    id: "ab-c-ban-05", caseStudyId: "ab-banking", domain: "ab-deploy", topic: "Governance controls",
    prompt: "Match each Woodgrove governance need to the Power Platform control that meets it without stopping business units from building agents.",
    targets: [
      "Stop agents in the lending environment from using unapproved connectors",
      "Apply sharing limits and usage insights to business-unit environments",
      "Apply the same rules to all seven units' environments at once",
    ],
    answers: ["A data policy for the environment", "Managed Environments", "Environment groups with rules"],
    distractors: ["A separate tenant for each business unit", "Removing maker licenses from the business units"],
    explanation: "Data policies control which connectors agents can use, Managed Environments add sharing limits and usage insights, and environment groups apply one set of rules to many environments together. A tenant per unit fragments governance, and removing licenses stops the building the constraint says must continue.",
    syllabus: cite("Design governance for agents", "https://learn.microsoft.com/power-platform/admin/wp-data-loss-prevention", "Data loss prevention policies"),
  }),
  gaps({
    id: "ab-c-ban-06", caseStudyId: "ab-banking", domain: "ab-plan", topic: "Center of Excellence setup",
    prompt: "Woodgrove has no extra central headcount this year. Complete its Center of Excellence design.",
    template: "Run the {0} to inventory every agent and its owner, publish {1} so units build within agreed patterns, and use {2} to retire agents whose owners have left.",
    blanks: [
      ["CoE Starter Kit core components", "Power BI sample dashboards", "Azure Cost Management exports"],
      ["reusable templates and guardrails", "a ban on new agents", "a single central build team"],
      ["governance processes", "tenant isolation", "nurture components"],
    ],
    explanation: "The Starter Kit's core components build the inventory of resources and owners, reusable templates and guardrails let units keep building safely, and governance processes such as compliance checks and archiving deal with orphaned agents. Sample dashboards and cost exports do not inventory ownership, a ban or a central team contradicts the constraints, tenant isolation controls cross-tenant access, and nurture components focus on training and adoption.",
    syllabus: cite("Include the elements of the Microsoft AI Center of Excellence", "https://learn.microsoft.com/power-platform/guidance/coe/starter-kit", "Center of Excellence starter kit"),
  }),

  // --- Fourth Coffee Council (8) ---
  match({
    id: "ab-c-pub-05", caseStudyId: "ab-public", domain: "ab-design", topic: "System topics",
    prompt: "Match each Fourth Coffee Council conversation situation to the Copilot Studio system topic that handles it.",
    targets: [
      "The agent cannot match a resident's question",
      "A resident asks to speak to a person",
      "Two topics could answer the same question",
      "An action fails during the conversation",
    ],
    answers: ["Fallback", "Escalate", "Multiple Topics Matched", "On Error"],
    distractors: ["Greeting", "Reset Conversation"],
    explanation: "Fallback handles unrecognized input, Escalate hands the resident to a person, Multiple Topics Matched asks the resident to choose when intents overlap, and On Error handles failures. Greeting opens a conversation, and Reset Conversation clears it; neither handles these situations.",
    syllabus: cite("Design topics for Copilot Studio, including fallback", "https://learn.microsoft.com/microsoft-copilot-studio/authoring-system-topics", "Use system topics"),
  }),
  gaps({
    id: "ab-c-pub-06", caseStudyId: "ab-public", domain: "ab-deploy", topic: "Keeping data in the country",
    prompt: "Resident data must stay inside the national boundary. Complete the council's configuration plan for the agent solution.",
    template: "Create the Copilot Studio environment in a {0} region, keep {1} turned off so prompts are not processed in another geography, and confirm the {2} of the Customer Service data is in the same geography.",
    blanks: [
      ["national", "global", "neighboring-country"],
      ["cross-region data movement", "multifactor authentication", "the Fallback topic"],
      ["Dynamics 365 environment location", "Teams client region", "residents' browser language"],
    ],
    explanation: "The environment's region decides where agent data lives, and the setting that allows generative AI features to move data across regions must stay off so nothing is processed outside the boundary. Customer Service data lives in its Dynamics 365 environment, whose location must match. Multifactor authentication, the Fallback topic, Teams clients, and browser language do not decide where data is stored or processed.",
    syllabus: cite("Validate data residency and movement compliance", "https://learn.microsoft.com/purview/ai-microsoft-purview", "Microsoft Purview for AI"),
  }),
  choose({
    id: "ab-c-pub-07", caseStudyId: "ab-public", domain: "ab-deploy", topic: "Quarterly fairness report",
    prompt: "The council must show residents are treated consistently and can always reach a person. Which two measures belong in its quarterly report? Each correct answer presents part of the solution.",
    options: [
      "Resolution and escalation rates broken down by resident group",
      "Time for an escalated resident to reach an officer",
      "Total number of messages that the agent processed this quarter",
      "Average length of the agent's answers across every topic",
      "Number of new topics authored by the makers this quarter",
    ],
    explanation: "Rates broken down by resident group show whether outcomes are consistent, and time to reach an officer shows whether the human route is dependable. Message volume, answer length, and topic counts describe activity rather than fairness or access to a person.",
    syllabus: cite("Review solution for adherence to responsible AI principles", "https://learn.microsoft.com/azure/well-architected/ai/responsible-ai", "Responsible AI in the Well-Architected Framework"),
  }),
  sequence({
    id: "ab-c-pub-08", caseStudyId: "ab-public", domain: "ab-design", topic: "Phased feature rollout",
    prompt: "Arrange the Fourth Coffee Council rollout of Dynamics 365 Customer Service AI features in order.",
    steps: [
      "Enable the AI features for permit enquiries only",
      "Measure resolution and escalation rates against the baseline",
      "Review the results with the service lead and the scrutiny committee",
      "Extend the features to waste-collection enquiries",
    ],
    distractors: ["Enable every feature for all enquiry types on day one", "Remove the escalation path once resolution improves"],
    explanation: "A phased rollout starts with one enquiry type, measures it against a baseline, reviews the evidence with the people accountable for it, and only then widens. Enabling everything at once leaves no evidence to act on, and removing the escalation path breaks the constraint that residents can always reach a person.",
    syllabus: cite("Orchestrate AI features in Dynamics 365 apps for customer experience and service", "https://learn.microsoft.com/dynamics365/customer-service/administer/configure-copilot-features", "Configure Copilot features in Customer Service"),
  }),

  // --- Trey Research Advisory (6) ---
  match({
    id: "ab-c-con-05", caseStudyId: "ab-consulting", domain: "ab-design", topic: "Extending Microsoft 365 Copilot",
    prompt: "Trey Research wants to keep Microsoft 365 Copilot's own orchestration. Match each need to the extensibility option that fits it.",
    targets: [
      "Draft from engagement material already stored in SharePoint",
      "Read live proposal status from the CRM's REST API",
      "Make an external document archive searchable by Copilot",
    ],
    answers: [
      "A declarative agent with the SharePoint sites as knowledge",
      "An API plugin action on the declarative agent",
      "A Microsoft 365 Copilot connector",
    ],
    distractors: ["A custom engine agent with its own model", "A public website knowledge source"],
    explanation: "A declarative agent uses Copilot's orchestrator with its own instructions and SharePoint knowledge, an API plugin action lets it call a REST API for live data, and a Copilot connector brings external content into Microsoft Graph for Copilot to search. A custom engine agent replaces the orchestrator the firm wants to keep, and a public website source would expose nothing confidential and none of the firm's material.",
    syllabus: cite("Design agents in Microsoft 365 Copilot", "https://learn.microsoft.com/microsoft-365-copilot/extensibility/", "Microsoft 365 Copilot extensibility"),
  }),
  gaps({
    id: "ab-c-con-06", caseStudyId: "ab-consulting", domain: "ab-plan", topic: "Grounding readiness",
    prompt: "Complete Trey Research's grounding-readiness checklist before the proposal agent launches.",
    template: "Remove {0} from the engagement libraries, confirm that sensitivity labels and {1} reflect client boundaries, and check that new material becomes retrievable within the {2}.",
    blanks: [
      ["superseded draft versions", "signed engagement letters", "partner approval notes"],
      ["site permissions", "document templates", "file naming rules"],
      ["agreed indexing window", "next fiscal quarter", "annual content review"],
    ],
    explanation: "Superseded drafts produce outdated answers, permissions and labels decide what each consultant can retrieve, and new material has to be available within an agreed window for same-day drafting. Signed engagement letters and partner approval notes are legitimate content, templates and naming rules do not control access, and a quarterly or annual cadence is far too slow.",
    syllabus: cite("Review data for grounding, including accuracy, relevance, timeliness, cleanliness, and availability", "https://learn.microsoft.com/azure/cloud-adoption-framework/ai-agents/data-architecture-plan", "Data architecture for AI agents"),
  }),

  // --- Relecloud Utilities (7) ---
  match({
    id: "ab-c-uti-05", caseStudyId: "ab-utilities", domain: "ab-design", topic: "Behavior per use case",
    prompt: "Match each Relecloud use case to the Copilot Studio agent behavior it needs.",
    targets: [
      "Ask for an asset's fault history while wearing gloves",
      "Dictate completed work from a van without signal",
      "Ask for the lockout procedure",
    ],
    answers: [
      "Voice mode with short spoken confirmations",
      "Local capture that syncs to the work order later",
      "The approved passage returned verbatim with its reference",
    ],
    distractors: ["A reasoning model that paraphrases the procedure", "Autonomous reassignment of the engineer's next job"],
    explanation: "Hands-free lookup needs voice with confirmations short enough to follow by ear, dictation must be captured locally and synced when signal returns, and safety guidance is returned verbatim with its source. Paraphrasing a procedure breaks the safety constraint, and reassigning jobs is a dispatch decision that stays with people.",
    syllabus: cite("Design agent behaviors in Copilot Studio, including reasoning and voice mode", "https://learn.microsoft.com/microsoft-copilot-studio/voice-overview", "Voice-enabled agents in Copilot Studio"),
  }),
  gaps({
    id: "ab-c-uti-06", caseStudyId: "ab-utilities", domain: "ab-plan", topic: "Where agents fit",
    prompt: "Complete Relecloud's assessment of where agents fit in its field operations.",
    template: "Asset-history lookup suits {0}, trend analysis of repeat faults suits {1}, and choosing which engineer to dispatch stays with {2}.",
    blanks: [
      ["an agent answering from Dataverse", "the dispatcher alone", "a monthly printed report"],
      ["an analytics agent over fault data", "the voice agent on site", "the dispatcher's memory"],
      ["the human dispatcher", "an autonomous agent", "the voice agent"],
    ],
    explanation: "Lookups are well-defined retrieval tasks that an agent answers from Dataverse, trend analysis suits an analytics agent working over the fault data, and dispatch decisions stay with the human dispatcher, as the case requires. The on-site voice agent is built for quick answers rather than analysis, and handing dispatch to an autonomous or voice agent breaks the constraint.",
    syllabus: cite("Assess the use of agents in task automation, data analytics, and decision-making", "https://learn.microsoft.com/azure/cloud-adoption-framework/ai-agents/build-secure-process", "Process to build agents across your organization"),
  }),
  choose({
    id: "ab-c-uti-07", caseStudyId: "ab-utilities", domain: "ab-deploy", topic: "Field-ready testing",
    prompt: "Which two tests give the strongest evidence that Relecloud's voice agent is safe to use on site? Each correct answer presents part of the solution.",
    options: [
      "An exact-match test that safety answers equal the approved passages",
      "Voice tests in vehicles with realistic noise and loss of signal",
      "Tests in the office test chat only, over a stable connection",
      "A count of how often engineers thank the agent at the end",
      "A text-similarity test for the safety procedure answers",
    ],
    explanation: "Safety answers must match the approved text exactly, so exact match is the right test method, and field conditions such as noise and signal loss are what the agent will face. Office-only testing misses both, thanks are not evidence of safety, and text similarity would pass an answer that paraphrases a procedure.",
    syllabus: cite("Recommend the process and metrics to test agents", "https://learn.microsoft.com/microsoft-copilot-studio/analytics-agent-evaluation-overview", "Choose evaluation methods"),
  }),

  // --- Contoso University (8) ---
  match({
    id: "ab-c-edu-05", caseStudyId: "ab-education", domain: "ab-deploy", topic: "Choosing test methods",
    prompt: "Match each Contoso University test goal to the Copilot Studio evaluation method that checks it.",
    targets: [
      "The answer must include the exact IELTS score of 6.5",
      "The answer should convey the policy even if it is worded differently",
      "Exception requests must call the escalation tool",
      "Overall answer quality, including relevance and completeness",
    ],
    answers: ["Keyword match", "Compare meaning", "Tool use", "General quality"],
    distractors: ["Text similarity", "Content safety"],
    explanation: "Keyword match checks that required terms such as the score appear, compare meaning scores intent rather than wording, tool use confirms the expected tool or topic ran, and general quality rates relevance, groundedness, and completeness. Text similarity rewards matching wording, which the second goal does not require, and content safety checks for harmful content.",
    syllabus: cite("Recommend the process and metrics to test agents", "https://learn.microsoft.com/microsoft-copilot-studio/analytics-agent-evaluation-overview", "Choose evaluation methods"),
  }),
  gaps({
    id: "ab-c-edu-06", caseStudyId: "ab-education", domain: "ab-design", topic: "Admissions agent proposal",
    prompt: "Complete the architect's proposal for Contoso University's admissions staff.",
    template: "Build a {0} in Microsoft 365 Copilot with the admissions SharePoint sites as knowledge, so answers respect each staff member's {1}, and hand applicant exceptions to officers through {2}.",
    blanks: [
      ["declarative agent", "custom engine agent", "public website chatbot"],
      ["existing SharePoint permissions", "Teams presence status", "Outlook mailbox signature"],
      ["a case-creation action", "a reply asking the applicant to email", "a weekly export"],
    ],
    explanation: "A declarative agent extends the Copilot staff already use and retrieves SharePoint content with each user's permissions, so one faculty's restricted material stays hidden from others. A case-creation action routes exceptions to officers in Customer Service with context. A custom engine agent or a public chatbot adds a new surface, presence status and signatures do not govern access, and an email reply or weekly export delays escalation.",
    syllabus: cite("Propose Microsoft 365 agents for business scenarios", "https://learn.microsoft.com/microsoft-365-copilot/extensibility/agents-are-apps", "Agents are apps for Microsoft 365"),
  }),
  choose({
    id: "ab-c-edu-07", caseStudyId: "ab-education", domain: "ab-plan", topic: "Launch baseline",
    prompt: "Contoso University's first release must produce measurable evidence before expansion. Which two measures should be baselined before launch? Each correct answer presents part of the solution.",
    options: [
      "Average time staff spend answering a routine policy question",
      "Share of answers citing the current approved policy correctly",
      "Number of Copilot licenses assigned to the admissions staff",
      "Count of SharePoint pages stored in the faculty policy libraries",
      "Number of prompts that staff members send to Copilot every day",
    ],
    explanation: "Time per answer and the accuracy of cited answers are the outcomes the programme promises to improve, so both need a pre-launch baseline. The number of licenses assigned, pages stored in the libraries, and prompts sent each day describe inputs and activity rather than value.",
    syllabus: cite("Select ROI criteria for AI-powered business solutions, including the total cost of ownership", "https://learn.microsoft.com/azure/foundry/concepts/manage-costs", "Plan and manage costs for Microsoft Foundry"),
  }),
  sequence({
    id: "ab-c-edu-08", caseStudyId: "ab-education", domain: "ab-deploy", topic: "Policy change release",
    prompt: "A faculty changes its English-language requirement. Arrange the steps that keep Contoso University's admissions agent accurate.",
    steps: [
      "The faculty owner publishes the new policy in the faculty library",
      "The old version is marked superseded and removed from the agent's scope",
      "The regression test set is updated with the new requirement",
      "The test set passes before the change is announced to staff",
    ],
    distractors: ["Staff are told to disregard answers based on the old rule", "The new rule is pasted into the agent's instructions"],
    explanation: "The owner publishes the change, the superseded version is taken out of scope so it cannot be cited, the test set gains the new requirement, and the change is announced only once the tests pass. Telling staff to ignore old answers leaves the agent wrong, and hard-coding rules into the instructions creates a second source that drifts from the library.",
    syllabus: cite("Design the ALM process for data used in AI models and agents", "https://learn.microsoft.com/power-platform/alm/overview-alm", "Application lifecycle management in Power Platform"),
  }),

  // --- Alpine Hotels (7) ---
  match({
    id: "ab-c-hot-05", caseStudyId: "ab-hospitality", domain: "ab-deploy", topic: "Risk controls",
    prompt: "Match each Alpine Hotels risk to the agent design control that addresses it.",
    targets: [
      "Payment data appearing in stored conversation transcripts",
      "The agent granting compensation above the fixed limit",
      "A caller trying to hear another guest's booking details",
    ],
    answers: [
      "Redaction of card and payment data before transcripts are stored",
      "A limit enforced in the compensation action, with escalation",
      "Verification of the caller's identity before reservations are read",
    ],
    distractors: ["A longer greeting message", "Public read access to the property API"],
    explanation: "Redacting payment data before storage keeps it out of telemetry, enforcing the limit in the action means the model cannot exceed it, and verifying identity before reading reservations stops disclosure to the wrong caller. A longer greeting changes nothing, and public API access would widen exposure.",
    syllabus: cite("Design security for agents", "https://learn.microsoft.com/microsoft-copilot-studio/security-and-governance", "Copilot Studio security and governance"),
  }),
  gaps({
    id: "ab-c-hot-06", caseStudyId: "ab-hospitality", domain: "ab-design", topic: "Approval flow",
    prompt: "Complete the Alpine Hotels Copilot Studio design for a high-value reservation change.",
    template: "The agent drafts the suite change, an {0} sends a {1} to the reservations team, and the scoped update runs only after the flow receives {2}.",
    blanks: [
      ["agent flow", "system topic", "knowledge source"],
      ["request for approval", "guest satisfaction survey", "calendar invitation"],
      ["an approval response", "a guest follow-up message", "a timeout"],
    ],
    explanation: "An agent flow is deterministic and can wait durably for a person, so it sends the approval request and runs the scoped update only after an approval response. A system topic manages conversation flow and a knowledge source supplies content; a survey, a calendar invitation, a guest message, or a timeout is not staff approval.",
    syllabus: cite("Design agents and agent flows with Copilot Studio", "https://learn.microsoft.com/microsoft-copilot-studio/flows-overview", "Agent flows overview"),
  }),
  choose({
    id: "ab-c-hot-07", caseStudyId: "ab-hospitality", domain: "ab-plan", topic: "Multilingual amenity answers",
    prompt: "A guest asks by chat, in German, whether the Alpine spa is open late. Which two design choices give a consistent, correct answer? Each correct answer presents part of the solution.",
    options: [
      "Answer from the approved SharePoint amenity policies with a citation",
      "Configure German as a supported language of the Copilot Studio agent",
      "Let the model answer from its general knowledge about hotel spas",
      "Query the property-management API for the spa's opening hours",
      "Paste German translations of the policies into the agent instructions",
    ],
    explanation: "Amenity details come from the approved policies with a citation, and configuring German as a supported language lets the agent answer German guests in German from that same source. General knowledge is not Alpine's policy, the property API serves availability and reservations, and translations pasted into instructions become a second copy that drifts from the approved text.",
    syllabus: cite("Determine the use of generative AI and knowledge sources in agents built with Copilot Studio", "https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio", "Knowledge sources in Copilot Studio"),
  }),

  // --- Wingtip Construction (7) ---
  sequence({
    id: "ab-c-construction-05", caseStudyId: "ab-construction", domain: "ab-design", topic: "Permit submission flow",
    prompt: "Arrange the Wingtip permit submission steps so the Copilot Studio computer-use agent acts only on an approved update.",
    steps: [
      "The supervisor approves the permit update in the canvas app",
      "The approval triggers the agent with the approved field values",
      "Computer use fills in the municipal form with only those values",
      "The agent saves the confirmation number back to Dataverse",
    ],
    distractors: ["The agent submits first and asks for approval afterward", "The agent reads extra instructions from the contractor PDF"],
    explanation: "Approval comes first and starts the run, the agent enters only the approved values, and the confirmation number is recorded for traceability. Submitting before approval breaks the constraint, and instructions found in a contractor document are untrusted and must never steer the agent.",
    syllabus: cite("Design agents to automate tasks in apps and websites by using Computer Use in Copilot Studio", "https://learn.microsoft.com/microsoft-copilot-studio/computer-use", "Computer use in Copilot Studio"),
  }),
  gaps({
    id: "ab-c-construction-06", caseStudyId: "ab-construction", domain: "ab-deploy", topic: "Injection mitigations",
    prompt: "A contractor's PDF tells the Wingtip agent to skip approval. Complete the mitigation design.",
    template: "Treat contractor document text as {0}, enforce the supervisor approval {1}, and review the Copilot Studio {2} findings before each release.",
    blanks: [
      ["untrusted data", "trusted instructions", "part of the system prompt"],
      ["outside the model, in the workflow", "in the agent's instructions only", "by asking the model to be careful"],
      ["security scan", "spelling check", "theme preview"],
    ],
    explanation: "Document text is data and can never become instructions, and an approval enforced by the workflow cannot be talked around, whereas instructions or a request to be careful only influence the model. Copilot Studio's automatic security scan flags risky configurations before release; spelling checks and theme previews do not assess security.",
    syllabus: cite("Analyze solution and AI vulnerabilities and mitigations, including prompt manipulation", "https://learn.microsoft.com/microsoft-copilot-studio/security-and-governance", "Copilot Studio security and governance"),
  }),
  choose({
    id: "ab-c-construction-07", caseStudyId: "ab-construction", domain: "ab-design", topic: "Reliable in-app drafting",
    prompt: "Which two design choices make inspection-summary drafting reliable for Wingtip supervisors inside the canvas app? Each correct answer presents part of the solution.",
    options: [
      "Pass the inspection record's fields to the prompt as structured input",
      "Let the supervisor edit and confirm the draft before it is saved",
      "Send the entire Dataverse inspections table to the prompt each time",
      "Save every draft without review so supervisors spend less time on it",
      "Generate the summary only after the related permit has been submitted",
    ],
    explanation: "Structured input from the current record grounds the draft in the right inspection, and supervisor confirmation keeps a person responsible for what is saved. Sending the whole table adds noise and exposure, saving without review stores unchecked text, and waiting for the permit delays a summary that supervisors need during the inspection.",
    syllabus: cite("Design a business process to include AI components in a Power Apps canvas app", "https://learn.microsoft.com/power-platform/well-architected/intelligent-application/", "Intelligent application workload"),
  }),
];
