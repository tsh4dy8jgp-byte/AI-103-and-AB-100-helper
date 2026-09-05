# AB-100 audiobook: sources and coverage

This is the reading companion, not the TTS input. Convert `ab100-audiobook.txt` to audio.

## Edition and format

- Prepared on August 31, 2026, against the English AB-100 objectives effective July 22, 2026. The official weighting is planning 25–30%, design 25–30%, and deployment 40–45%. [Microsoft AB-100 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100)
- Narration: 14,437 whitespace-delimited words, an introduction, and 22 chapters. Approximately 96 minutes at 150 words per minute, before additional pauses.
- The narration contains only ASCII letters, spaces, line breaks, and ordinary sentence punctuation. Numbers and abbreviations are written for speech. It contains no URLs, citation markers, Markdown, code, tables, brackets, currency signs, percentage signs, or stage directions.
- Northstar, its business cases, financial assumptions, and practice questions are original fictional teaching examples. They are not actual exam questions or Microsoft-prescribed thresholds.
- Architectural heuristics, tradeoff analyses, and recommended controls are original synthesis. Product capabilities are grounded in the primary sources below. This is preparation material, not a substitute for hands-on practice or a guarantee of exam coverage.
- Callbacks use AI-901 for fundamentals, AI-103 for implementation, GH-300 for AI-assisted development and review, and GH-600 for agent operation and governance. CCF-A is retained as you supplied it, without guessing its full title or attributing specific competencies to it.

## Objective coverage

The mapping below groups objectives from the official guide; several chapters intentionally span domains.

| Objective family | Chapters |
| --- | --- |
| Requirements, process analysis, and grounding readiness | 1, 2, 4 |
| Adoption strategy, platform selection, custom models, prompts, multi-agent design | 3, 5, 7, 8, 9, 11, 12 |
| ROI, total ownership cost, build/buy/extend, model routing | 3, 6, 7 |
| Agent behavior, topics, fallback, flows, Foundry Tools, app integration | 3, 7, 8, 9, 10, 12 |
| Extensibility, MCP, Agent2Agent, Computer Use, Microsoft 365, voice | 3, 9, 10, 12 |
| Prebuilt agents, Sales, Service, finance, supply chain, AI hub, additional knowledge | 10, 11, 12 |
| Monitoring, telemetry, user feedback, analysis, tuning | 15, 16 |
| Test strategy, custom-model validation, prompt evaluation, cross-app testing | 13, 14 |
| ALM for agents, connectors, models, data, and Dynamics dependencies | 17, 18 |
| Security, responsible AI, governance, vulnerabilities, residency, access, audit | 19, 20, 21 |
| Integrated scenario application and final recall | 22 |

## Primary sources by topic

### Exam and certification callbacks

The current objective list and official course establish the scope, not the wording of the original scenarios. [AB-100 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100), [AB-100 course](https://learn.microsoft.com/en-us/training/courses/ab-100t00).

The callbacks to fundamentals and governed agent execution align with the published credential descriptions. [AI-901 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-901), [GH-300 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-300), [GH-600 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-600).

### Strategy, ownership, and platform choice

Business-led adoption, organizational readiness, shared platform responsibility, and an evolving Center of Excellence support chapters 2 and 5. [AI strategy](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai/), [Establish an AI Center of Excellence](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai/center-of-excellence), [Organizational readiness for AI agents](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/organization-people-readiness-plan).

Copilot Studio's authoring model and the distinction between declarative and custom-engine agents support chapter 3. [Copilot Studio overview](https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio), [Agents for Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/agents-overview), [Custom engine agent architecture](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/custom-engine-agent-architecture).

Model routing is a model-selection capability whose configuration still requires workload evaluation. [How model router works](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-router-how-it-works).

### Orchestration, prompts, and tools

The documentation distinguishes classic and generative orchestration and explains the role of instructions, topics, knowledge, and tools. [Generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-generative-actions), [High-quality instructions](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-mode-guidance), [Natural language understanding](https://learn.microsoft.com/en-us/microsoft-copilot-studio/nlu-overview).

MCP tools, cross-agent delegation, and visual interaction have distinct purposes and trust boundaries. [Agent tools](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools), [Agent2Agent connections](https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-agent-agent-to-agent), [Multi-agent patterns](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/architecture/multi-agent-patterns), [Computer Use](https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use).

### Sales, service, and voice

Sales customization includes business terminology and supported extensions; the Microsoft 365 Sales experience has its own configuration prerequisites. [Customize Copilot in Dynamics 365 Sales](https://learn.microsoft.com/en-us/dynamics365/sales/extend-copilot-chat), [Set up Sales agent in Microsoft 365 Copilot](https://learn.microsoft.com/en-us/microsoft-sales-copilot/set-up-sales-chat), [Custom research insights and tools](https://learn.microsoft.com/en-us/dynamics365/sales/sales-qualification-agent-custom-research-topics).

Prebuilt sales and service agents have specific roles and application boundaries. [Sales agents and app registrations](https://learn.microsoft.com/en-us/dynamics365/sales/ai-agents-apps), [Autonomous service agents](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/autonomous-agents-overview), [Service agent configuration](https://learn.microsoft.com/en-us/microsoft-copilot-service/copilot-create-test).

Voice integration requires both agent and contact-center configuration, with speech handling and conversation-control choices. [Voice-enabled agent integration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-get-started), [Choose conversation control](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/voice-agents-control-conversation).

### Finance and supply chain

The audiobook deliberately separates procedural help from operational-data knowledge. The documentation describes different extension paths; do not assume virtual-entity support in one experience means support in every help configuration. [Extend generative help and guidance](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/copilot/extend-copilot-generative-help), [Add knowledge to finance and operations agents](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/copilot/tutorial-agent-knowledge), [Chat with finance and operations data](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/copilot/chat-with-fno-data).

Prebuilt finance and operations agents have solution and platform prerequisites. [Dynamics 365 agent deployment](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/copilot/agent-deployment).

### Power Apps and Microsoft 365 experiences

Code-generated pages remain application code requiring validation. Agent feed is a supported supervision experience with specific onboarding requirements. [Code-first generative pages](https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/generative-page-external-tools), [Agent feed](https://learn.microsoft.com/en-us/power-apps/user/use-suggested-actions-in-the-agent-feed), [AI features in apps](https://learn.microsoft.com/en-us/power-apps/user/ai-in-apps).

AI Builder supplies task-specific capabilities, and Microsoft 365 includes specialized research and analysis experiences. [AI Builder models and scenarios](https://learn.microsoft.com/en-us/ai-builder/model-types), [Researcher FAQ](https://learn.microsoft.com/en-us/microsoft-365/copilot/faq-researcher).

The Power Platform framework has five pillars, including Experience Optimization; it should not be confused with the Azure pillar list. [Power Platform Well-Architected](https://learn.microsoft.com/en-us/power-platform/well-architected/).

### Evaluation, monitoring, and lifecycle

Copilot Studio supports single-response and conversational evaluation. The book's broader testing advice includes original business cases and risk-based criteria. [Create an evaluation test set](https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-create).

Agent observability includes application traces and business-facing insights, with data-handling responsibilities for telemetry. [Foundry tracing setup](https://learn.microsoft.com/en-us/azure/foundry/observability/how-to/trace-agent-setup), [Foundry trace data](https://learn.microsoft.com/en-us/azure/foundry/observability/concepts/trace-data), [Dynamics agent insights](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/agent-insights).

Solutions, environment configuration, dependencies, and release controls support chapters 17 and 18. [Copilot Studio solutions](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-solutions-overview), [Manage checklist](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/manage-checklist), [Dynamics Sales agent solution import](https://learn.microsoft.com/en-us/dynamics365/sales/import-export-agent-solutions), [Foundry agent lifecycle management](https://learn.microsoft.com/en-us/azure/foundry/control-plane/how-to-manage-agents).

### Security, responsible AI, and residency

Authentication, platform governance, and retrieval hygiene are complementary controls, not substitutes for one another. [User authentication](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-end-user-authentication), [Copilot Studio security and governance](https://learn.microsoft.com/en-us/microsoft-copilot-studio/security-and-governance), [Secure Copilot Studio projects](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/sec-gov-phase3), [Input, context, and retrieval hygiene](https://learn.microsoft.com/en-us/security/zero-trust/catalog-ai-defense-capabilities/input-context-retrieval-hygiene).

Prompt Shields addresses adversarial inputs; the Responsible AI Standard covers a wider responsibility model. [Prompt Shields](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/content-filter-prompt-shields), [Microsoft Responsible AI Standard](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/final/en-us/microsoft-brand/documents/Microsoft-Responsible-AI-Standard-General-Requirements.pdf).

Residency review must consider feature-specific processing, logging, and external connections. [Copilot Studio data locations](https://learn.microsoft.com/en-us/microsoft-copilot-studio/data-location), [Geographic data residency](https://learn.microsoft.com/en-us/microsoft-copilot-studio/geo-data-residency), [Microsoft 365-powered activity data](https://learn.microsoft.com/en-us/microsoft-copilot-studio/manage-activity-data-m365), [Foundry deployment types](https://learn.microsoft.com/en-us/azure/ai-foundry/foundry-models/concepts/deployment-types?view=foundry-classic).

## Availability and terminology cautions

The exam outline, current product documentation, and older learning material can use different names. In particular, distinguish the exam's Copilot for Sales and Copilot for Service terminology from newer Sales agent and Service experiences; distinguish generative help from operational-data chat; and verify the applicable Copilot Studio experience. Preview status, licensing, supported models, regions, and setup steps are not assumed to be universal. Use the product-specific links above before implementation or final exam revision.

## Verification performed

- Confirmed the narration remains within the requested 12,000–16,000-word range.
- Checked all 22 chapter headings and screened for duplicate paragraphs.
- Checked the entire narration for digits, non-ASCII characters, and symbols outside the allowed sentence-punctuation set; none were found.
- Recalculated the illustrative ROI example: 240,000 annual benefit, 156,000 first-year cost, 84,000 net benefit, approximately 54% ROI, and five-month simple steady-state payback.
- Reviewed the objective-family coverage and added specific material on Sales/Service configuration, voice, specialized Microsoft 365 agents, and model-versus-data remediation.
- Did not synthesize or listen to audio in a particular TTS engine. Pronunciation and pause behavior will depend on the engine you use.
