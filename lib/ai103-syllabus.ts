import type { DomainId } from "./questions";

export interface SyllabusSkill {
  skill: string;
  bullets: string[];
}

export interface SyllabusDomain {
  id: DomainId;
  domain: string;
  skills: SyllabusSkill[];
}

/**
 * The published AI-103 "Skills measured" outline (as of April 16, 2026).
 * Claude-authored questions cite these bullets verbatim; the question-bank audit
 * fails if a citation does not match an entry here, so references cannot drift.
 * Source: https://learn.microsoft.com/credentials/certifications/resources/study-guides/ai-103
 */
export const AI103_SYLLABUS: SyllabusDomain[] = [
  {
    id: "plan",
    domain: "Plan and manage an Azure AI solution (25–30%)",
    skills: [
      {
        skill: "Choose the appropriate Foundry services for generative AI and agents",
        bullets: [
          "Choose an appropriate model for each task, including large language models (LLMs), small language models, multimodal models, and Foundry Tools",
          "Choose the appropriate Foundry services for generative tasks, grounding, vector search, agent workflows, or multimodal processing",
          "Choose an appropriate method for retrieval and indexing",
          "Choose appropriate memory, tool, and knowledge integration services for agent solutions",
        ],
      },
      {
        skill: "Set up AI solutions in Foundry",
        bullets: [
          "Design Azure infrastructure for AI apps and agent-based solutions",
          "Choose appropriate deployment options",
          "Configure model and agent deployments",
          "Integrate Foundry projects with continuous integration and continuous deployment (CI/CD) pipelines",
        ],
      },
      {
        skill: "Manage, monitor, and secure AI systems",
        bullets: [
          "Manage quotas, scaling, rate limits, and cost footprints for model and agent workloads",
          "Monitor model performance, drift, safety events, and grounding quality",
          "Monitor data ingestion quality, search index health, and relevance performance",
          "Configure security, including managed identity, private networking, keyless credentials, and role policies",
        ],
      },
      {
        skill: "Implement responsible AI across generative AI and agentic systems",
        bullets: [
          "Configure safety filters, guardrails, risk detection, and content moderation",
          "Apply responsible AI instrumentation, including evaluators, safety evaluations, and explanation tooling",
          "Implement auditing through trace logging, provenance metadata, and approval workflows",
          "Govern agent behavior with oversight modes, constraints, and tool-access controls",
        ],
      },
    ],
  },
  {
    id: "gen",
    domain: "Implement generative AI and agentic solutions (30–35%)",
    skills: [
      {
        skill: "Build generative applications by using Foundry",
        bullets: [
          "Deploy and consume LLMs, small models, code models, and multimodal models",
          "Implement retrieval-augmented generation (RAG) in an application",
          "Design workflows, tool-augmented flows, and multistep reasoning pipelines",
          "Evaluate models and apps, including detecting fabrications, relevance, quality, and safety",
          "Integrate generative workflows into applications by using Foundry SDKs and connectors",
          "Configure an application to connect to a Foundry project",
        ],
      },
      {
        skill: "Build agents by using Foundry",
        bullets: [
          "Define agent roles, goals, conversation-tracking approach, and tool schemas",
          "Build agents that integrate retrieval, function-calling, and conversation memory",
          "Integrate agent tools, including APIs, knowledge stores, search, content understanding, and custom functions",
          "Implement orchestrated multi-agent solutions",
          "Build autonomous or semiautonomous workflows with safeguards and approval flow controls",
          "Integrate monitoring into deployed agents, evaluate agent behavior, and perform error analysis",
        ],
      },
      {
        skill: "Optimize and operationalize generative AI systems",
        bullets: [
          "Tune generation behavior, such as prompt engineering and adjusting model parameters",
          "Implement model reflection, chain-of-thought evaluations, and self-critique loops",
          "Set up observability by implementing tracing, token analytics, safety signals, and latency breakdowns",
          "Orchestrate multiple models, flows, or hybrid LLM and rules engines",
        ],
      },
    ],
  },
  {
    id: "vision",
    domain: "Implement computer vision solutions (10–15%)",
    skills: [
      {
        skill: "Design and implement image- and video-generation solutions",
        bullets: [
          "Implement a solution that generates images from text prompts and reference media",
          "Implement a solution that generates videos from text prompts and reference media",
          "Configure image-editing workflows, including inpainting, mask‑based edits, and prompt‑driven modifications",
          "Implement workflows to edit generated videos",
          "Select and apply appropriate generation and editing controls provided by the platform",
        ],
      },
      {
        skill: "Design and implement multimodal understanding workflows",
        bullets: [
          "Build a solution that analyzes visual context by using multimodal models",
          "Configure apps to produce concise or detailed captions for single or multiple images",
          "Implement a solution that enables question‑answering grounded in visual evidence",
          "Configure generation of alt‑text and extended image descriptions aligned to accessibility guidelines",
          "Implement visual understanding by configuring Azure Content Understanding in Foundry Tools to extract visual characteristics",
          "Implement video analysis workflows to process and interpret video segments",
          "Configure single‑task and pro‑mode Content Understanding pipelines",
          "Implement solutions that identify objects, components, or regions within images or video",
        ],
      },
      {
        skill: "Implement responsible AI for multimodal content",
        bullets: [
          "Implement filters to classify unsafe or disallowed visual content",
          "Detect and mitigate indirect prompt injection by using embedded text in images",
          "Enforce visual policy rules, such as applying watermarks, flagging prohibited symbols, upholding brand usage requirements, and detecting potentially inappropriate content",
        ],
      },
    ],
  },
  {
    id: "language",
    domain: "Implement text analysis solutions (10–15%)",
    skills: [
      {
        skill: "Apply language model text analysis",
        bullets: [
          "Implement solutions to extract entities, topics, summaries, and structured JSON outputs by using generative prompting and Foundry Tools",
          "Configure detection of sentiment, tone, safety issues, and sensitive content",
          "Build solutions that translate text by using Azure Translator in Foundry Tools or LLM‑powered translation flows",
          "Customize language model outputs for domain tasks, such as compliance summarization and domain extraction",
        ],
      },
      {
        skill: "Implement speech solutions",
        bullets: [
          "Implement workflows to convert speech to text and text to speech for agentic interactions",
          "Integrate speech as an agent modality, including custom speech models",
          "Enable multimodal reasoning from audio inputs",
          "Translate speech into other languages by using language models and Foundry Tools",
        ],
      },
    ],
  },
  {
    id: "extract",
    domain: "Implement information extraction solutions (10–15%)",
    skills: [
      {
        skill: "Build retrieval and grounding pipelines",
        bullets: [
          "Ingest and index content, such as documents, images, audio, and video",
          "Configure semantic search, hybrid search, and vector search for grounding",
          "Implement enrichment by using custom or built-in skills for text, images, and layout",
          "Configure RAG ingestion flow, including documents and using optical character recognition (OCR)",
          "Connect retrieval pipelines directly to workflows and agent tools",
        ],
      },
      {
        skill: "Extract content from documents",
        bullets: [
          "Extract information by using multimodal pipelines that combine OCR, layout analysis, and field extraction",
          "Produce clean, grounded representations to use with agents and RAG by using Content Understanding",
          "Implement analyzers for generating structured or markdown outputs for downstream reasoning by using Content Understanding",
        ],
      },
    ],
  },
];

export const AI103_STUDY_GUIDE_URL = "https://learn.microsoft.com/credentials/certifications/resources/study-guides/ai-103";

/** Every bullet in the outline, for O(1) citation validation. */
export const AI103_BULLETS: ReadonlySet<string> = new Set(
  AI103_SYLLABUS.flatMap((domain) => domain.skills.flatMap((skill) => skill.bullets)),
);

export function getSyllabusDomain(id: DomainId): SyllabusDomain {
  return AI103_SYLLABUS.find((domain) => domain.id === id) ?? AI103_SYLLABUS[0];
}
