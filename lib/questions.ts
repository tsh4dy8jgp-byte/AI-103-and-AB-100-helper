export type ExamId = "ai103" | "ab100";
/** AI-103 skills-measured domains, then AB-100's. Prefixed so the two never collide. */
export type Ai103DomainId = "plan" | "gen" | "vision" | "language" | "extract";
export type Ab100DomainId = "ab-plan" | "ab-design" | "ab-deploy";
export type DomainId = Ai103DomainId | Ab100DomainId;
export type Difficulty = "Foundational" | "Applied" | "Advanced";
export type QuestionCollection = "core" | "sdk" | "copilot";

export interface DomainMeta {
  id: DomainId;
  name: string;
  shortName: string;
  weight: number;
  color: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  organization: string;
  background: string;
  existingEnvironment: string[];
  requirements: string[];
  constraints: string[];
}

export interface Question {
  id: string;
  domain: DomainId;
  topic: string;
  difficulty: Difficulty;
  prompt: string;
  options: string[];
  correct: number[];
  explanation: string;
  caseStudyId?: string;
  collection?: QuestionCollection;
  /** Absent means the original Northstar bank. */
  source?: QuestionSource;
  /** Optional code listing rendered above the answer options. */
  code?: CodeSample;
  /** Direct skills-measured citation into the exam's published outline. */
  syllabus?: SyllabusRef;
  /** Absent means AI-103, the original exam. */
  exam?: ExamId;
}

export type QuestionSource = "northstar" | "claude";
export type CodeLanguage = "python" | "javascript" | "csharp" | "json" | "bash";

/** A direct citation into the published AI-103 "Skills measured" outline. */
export interface SyllabusRef {
  /** Study-guide domain heading, including its published weight range. */
  domain: string;
  /** Study-guide sub-skill heading beneath the domain. */
  skill: string;
  /** The skills-measured bullet, verbatim. Validated against AI103_SYLLABUS. */
  bullet: string;
  /** Microsoft Learn documentation page for the feature under test. */
  docUrl: string;
  docTitle: string;
}

export interface CodeSample {
  language: CodeLanguage;
  snippet: string;
}

export const DOMAINS: DomainMeta[] = [
  { id: "plan", name: "Plan and manage an Azure AI solution", shortName: "Plan & manage", weight: 0.27, color: "#1557ff" },
  { id: "gen", name: "Implement generative AI and agentic solutions", shortName: "Generative AI & agents", weight: 0.33, color: "#7856ff" },
  { id: "vision", name: "Implement computer vision solutions", shortName: "Computer vision", weight: 0.13, color: "#e2552d" },
  { id: "language", name: "Implement text analysis solutions", shortName: "Text & speech", weight: 0.13, color: "#14836f" },
  { id: "extract", name: "Implement information extraction solutions", shortName: "Information extraction", weight: 0.14, color: "#bd7800" },
];

export const AB100_DOMAINS: DomainMeta[] = [
  { id: "ab-plan", name: "Plan AI-powered business solutions", shortName: "Plan & strategy", weight: 0.28, color: "#1557ff" },
  { id: "ab-design", name: "Design AI-powered business solutions", shortName: "Design & extensibility", weight: 0.27, color: "#7856ff" },
  { id: "ab-deploy", name: "Deploy AI-powered business solutions", shortName: "Deploy, ALM & governance", weight: 0.45, color: "#bd7800" },
];

export const EXAMS: Record<ExamId, { id: ExamId; code: string; name: string; domains: DomainMeta[] }> = {
  ai103: { id: "ai103", code: "AI-103", name: "Developing AI Apps and Agents on Azure", domains: DOMAINS },
  ab100: { id: "ab100", code: "AB-100", name: "Agentic AI Business Solutions Architect", domains: AB100_DOMAINS },
};

export const CASE_STUDIES: Record<string, CaseStudy> = {
  banking: {
    id: "banking",
    title: "Case study · Contoso Bank",
    organization: "Contoso Bank",
    background: "Contoso Bank is deploying a lending-policy agent in Microsoft Foundry. Approved PDFs are stored in private Azure Blob Storage and indexed in Azure AI Search. A web API invokes the agent by using managed identity.",
    existingEnvironment: ["Foundry project with a published lending-policy agent", "Azure AI Search index with region and document ACL fields", "Private Blob Storage containing approved policy PDFs"],
    requirements: ["Every answer must cite an authorized Azure AI Search passage.", "The web API can invoke only the lending-policy agent.", "The agent can read policies but cannot update the search index."],
    constraints: ["Public network access is disabled on Foundry, Storage, and Search.", "Keys and connection strings cannot be stored in application configuration."],
  },
  support: {
    id: "support",
    title: "Case study · Fabrikam Support",
    organization: "Fabrikam Support",
    background: "Fabrikam is building a multilingual Foundry agent. English manuals are indexed in Azure AI Search, and warranty status is available through an OpenAPI tool.",
    existingEnvironment: ["English product-manual index in Azure AI Search", "Foundry prompt agent with an OpenAPI warranty tool", "Application Insights connected to the Foundry project"],
    requirements: ["Support English, Spanish, and French conversations.", "Use the current English manual corpus without duplicating indexes.", "Warranty updates require specialist confirmation."],
    constraints: ["The monthly model-token budget is fixed.", "Warranty reads and writes must use different authorization boundaries."],
  },
  media: {
    id: "media",
    title: "Case study · Northwind Media",
    organization: "Northwind Media",
    background: "Northwind uses Foundry image models to create campaign assets from private reference images. Editors use masks for localized changes before an automated publication pipeline.",
    existingEnvironment: ["gpt-image-1 deployment in Microsoft Foundry", "Private Blob containers for reference and generated assets", "Automated publication workflow with an editorial approval queue"],
    requirements: ["Every released asset needs visible watermarking and provenance metadata where supported.", "Editors must preserve pixels outside an edit mask.", "Uploaded media cannot redefine agent or tool instructions."],
    constraints: ["Standard harm filters do not cover every brand-specific rule.", "Reference assets must remain private in Azure Blob Storage."],
  },
  healthcare: {
    id: "healthcare",
    title: "Case study · Alpine Health",
    organization: "Alpine Health",
    background: "Alpine processes scanned referral packets with Azure Content Understanding and produces clinician summaries through a Foundry model.",
    existingEnvironment: ["Microsoft Foundry resource with Content Understanding", "Private Storage account containing scanned referrals", "Clinician review queue and regional Application Insights workspace"],
    requirements: ["Return normalized JSON, layout-aware Markdown, and page/region evidence.", "Low-confidence medication fields require clinician review.", "Patient identifiers must be flagged before analytics ingestion."],
    constraints: ["All processing and telemetry must remain in an approved geography.", "Source documents use private Azure Storage access."],
  },
  travel: {
    id: "travel",
    title: "Case study · City Travel",
    organization: "City Travel",
    background: "City Travel is integrating Azure Speech with a Foundry booking agent for live multilingual calls.",
    existingEnvironment: ["Azure Speech resource and Speech SDK voice application", "Foundry booking agent with read and payment-change tools", "Application Insights tracing across the voice service"],
    requirements: ["Recognize likely caller languages with low latency.", "Pronounce airport and airline names correctly.", "Trace recognition, agent, tool, and synthesis latency separately."],
    constraints: ["Conversation state must be isolated per caller.", "Payment changes require explicit confirmation."],
  },
  factory: {
    id: "factory",
    title: "Case study · Wide World Manufacturing",
    organization: "Wide World Manufacturing",
    background: "Technicians upload manuals, equipment photos, and inspection videos. Azure services extract searchable representations that a Foundry repair agent retrieves.",
    existingEnvironment: ["Blob Storage landing zone for manuals, photos, and videos", "Azure AI Search multimodal index", "Foundry repair agent with read-only maintenance tools"],
    requirements: ["Large uploads must process asynchronously with per-item status.", "Search results must retain page, time, and asset provenance.", "OCR text on equipment labels is untrusted evidence."],
    constraints: ["Failed items must retry without reprocessing completed files.", "The agent may recommend repairs but cannot authorize them."],
  },
  legal: {
    id: "legal",
    title: "Case study · Proseware Legal",
    organization: "Proseware Legal",
    background: "Proseware extracts tables and clauses from contracts with Azure Content Understanding and indexes chunks in Azure AI Search for a Foundry agent.",
    existingEnvironment: ["Content Understanding custom contract analyzer", "Azure AI Search index with matter and group metadata", "Microsoft Entra groups assigned to legal matters"],
    requirements: ["Preserve tables, clause locations, and source evidence.", "Enforce matter-level access before retrieval.", "Measure retrieval recall, answer groundedness, and completeness."],
    constraints: ["Lawyers can access only matters present in verified Entra group claims.", "Unauthorized chunks must never enter model context."],
  },
  retail: {
    id: "retail",
    title: "Case study · Adventure Works Retail",
    organization: "Adventure Works Retail",
    background: "Adventure Works combines a Foundry shopping agent, Azure AI Search catalog knowledge, a live inventory API, and Azure image generation.",
    existingEnvironment: ["Azure AI Search product catalog", "Foundry shopping agent with an OpenAPI inventory tool", "gpt-image-1 deployment and image publication pipeline"],
    requirements: ["Live stock must come from the inventory tool.", "Localized descriptions must be validated structured JSON.", "A proprietary prohibited symbol must be blocked before image publication."],
    constraints: ["The agent must disclose inventory-tool failures.", "Standard Content Safety categories do not include the proprietary symbol."],
  },
  energy: {
    id: "energy",
    title: "Case study · Woodgrove Energy",
    organization: "Woodgrove Energy",
    background: "Woodgrove is building a field-service agent for wind-farm technicians. The agent retrieves repair procedures, analyzes equipment photographs, and reads current sensor values through an API.",
    existingEnvironment: ["Microsoft Foundry project with a multimodal model deployment", "Azure AI Search index populated from maintenance manuals", "Read/write operations exposed by an equipment OpenAPI service", "Application Insights connected to the Foundry project"],
    requirements: ["Technicians must receive source citations with repair guidance.", "The agent may read telemetry but cannot change equipment setpoints.", "Photographed labels must be analyzed without accepting embedded instructions.", "Operational traces must identify model, search, and tool latency."],
    constraints: ["All processing must remain within the EU data zone.", "The field application cannot store service keys."],
  },
  insurance: {
    id: "insurance",
    title: "Case study · Tailspin Insurance",
    organization: "Tailspin Insurance",
    background: "Tailspin automates first-pass motor-claim review from accident forms, repair estimates, and vehicle photographs. A Foundry agent can draft a settlement recommendation and query the policy system.",
    existingEnvironment: ["Azure Content Understanding resource for claim documents", "Private Blob Storage for forms and images", "Foundry agent with policy and payment OpenAPI operations", "Azure AI Content Safety resource"],
    requirements: ["Extract typed claim fields with source evidence and confidence.", "Detect unsafe or manipulated image content before review.", "Settlement payments require adjuster approval.", "Every tool call and approval decision must be auditable."],
    constraints: ["Customer PII cannot be copied into unrestricted trace fields.", "Low-confidence repair amounts require manual review."],
  },
  university: {
    id: "university",
    title: "Case study · Contoso University",
    organization: "Contoso University",
    background: "Contoso University is creating an accessible lecture assistant. It transcribes live classes, translates captions, indexes approved course material, and answers student questions with citations.",
    existingEnvironment: ["Azure Speech resource used for classroom audio", "Azure Translator resource", "Azure AI Search indexes separated by faculty", "Foundry agent embedded in the learning portal"],
    requirements: ["Display partial captions during lectures.", "Provide translated captions in two target languages.", "Restrict retrieval to courses in which the student is enrolled.", "Archive final transcripts after the class ends."],
    constraints: ["Guest lecturers use specialized vocabulary.", "Student identifiers must be removed from analytics exports."],
  },
  logistics: {
    id: "logistics",
    title: "Case study · Litware Logistics",
    organization: "Litware Logistics",
    background: "Litware is implementing a shipment-resolution agent. It extracts fields from bills of lading, retrieves operating procedures, and calls live routing and customs APIs.",
    existingEnvironment: ["Azure Content Understanding analyzer for shipping documents", "Azure AI Search operations index", "Foundry multi-agent workflow with routing and customs specialists", "Private endpoints for Foundry, Search, and Storage"],
    requirements: ["Preserve tables and page references from bills of lading.", "Use live APIs for shipment location and customs status.", "Escalate conflicting specialist results to a human operator.", "Retry transient tool failures without duplicating shipment updates."],
    constraints: ["Public network access is disabled.", "No agent may create additional agents dynamically."],
  },
};

export const CASE_STUDY_IDS = Object.keys(CASE_STUDIES);

export { AI103_BULLETS, AI103_STUDY_GUIDE_URL, AI103_SYLLABUS, getSyllabusDomain } from "./ai103-syllabus";
export type { SyllabusDomain, SyllabusSkill } from "./ai103-syllabus";
export { AB100_BULLETS, AB100_STUDY_GUIDE_URL, AB100_SYLLABUS } from "./ab100-syllabus";
export { AB100_CASE_STUDIES, AB100_CASE_STUDY_IDS, AB100_QUESTIONS } from "./ab100-questions";

import { AB100_QUESTIONS } from "./ab100-questions";
import { ADVANCED_QUESTIONS } from "./advanced-questions";
import { CLAUDE_QUESTIONS } from "./claude-questions";
import { withReferences } from "./question-references";
import { COPILOT_STUDIO_QUESTIONS as RAW_COPILOT, FOUNDRY_SDK_QUESTIONS as RAW_SDK } from "./specialty-questions";

// Every question carries its AI-103 skills-measured citation and Microsoft Learn link.
export const CORE_QUESTIONS = withReferences(ADVANCED_QUESTIONS);
export const FOUNDRY_SDK_QUESTIONS = withReferences(RAW_SDK);
export const COPILOT_STUDIO_QUESTIONS = withReferences(RAW_COPILOT);
export { CLAUDE_QUESTIONS };
/** The banks that are always in play. The Claude bank is opt-in and excluded here. */
export const QUESTIONS = [...CORE_QUESTIONS, ...FOUNDRY_SDK_QUESTIONS, ...COPILOT_STUDIO_QUESTIONS];
export const ALL_QUESTIONS = [...QUESTIONS, ...CLAUDE_QUESTIONS, ...AB100_QUESTIONS];

export const CLAUDE_QUESTIONS_BY_COLLECTION: Record<QuestionCollection, Question[]> = {
  core: CLAUDE_QUESTIONS.filter((question) => question.collection === "core"),
  sdk: CLAUDE_QUESTIONS.filter((question) => question.collection === "sdk"),
  copilot: CLAUDE_QUESTIONS.filter((question) => question.collection === "copilot"),
};

export function getDomain(id: DomainId): DomainMeta {
  return DOMAINS.find((domain) => domain.id === id) ?? DOMAINS[0];
}
