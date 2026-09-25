import { AI103_SYLLABUS } from "./ai103-syllabus.ts";
import { buildersFor, citeFrom } from "./question-builders.ts";
import type { Question } from "./questions";

/**
 * MAINTAINED BY HAND. Extra questions for the twelve AI-103 case studies, so that each
 * case carries six to eight questions in a mix of formats, as on the real exam. Every
 * case gains at least one drag-and-drop and one dropdown item, and each item leans on
 * the case's audience or use cases rather than on general knowledge alone.
 *
 * Authoring convention (see question-builders.ts): the right answer comes first.
 */
const { choose, match, sequence, gaps } = buildersFor("ai103");
const cite = citeFrom(AI103_SYLLABUS);

const SECURITY = "Configure security, including managed identity, private networking, keyless credentials, and role policies";

export const AI103_CASE_EXTENSIONS: Question[] = [
  // --- Contoso Bank (7) ---
  match({
    id: "cx-banking-05", caseStudyId: "banking", domain: "plan", topic: "Least-privilege roles",
    prompt: "Contoso Bank must grant least-privilege access across the lending-policy solution. Match each Azure principal to the role assignment it needs.",
    targets: [
      "Web API managed identity that only invokes the published agent",
      "Foundry project identity used by the agent's Azure AI Search tool",
      "Azure AI Search identity used by the indexer to read the policy PDFs",
      "Policy developers who build and test the agent",
    ],
    answers: [
      "Foundry Agent Consumer on the Foundry project",
      "Search Index Data Reader on the search service",
      "Storage Blob Data Reader on the storage account",
      "Foundry User on the Foundry project",
    ],
    distractors: ["Search Index Data Contributor on the search service", "Foundry Account Owner on the Foundry resource"],
    explanation: "Foundry Agent Consumer only lets a principal call agent endpoints, which is all the web API needs. The agent reads the index, so Search Index Data Reader meets the requirement that it cannot update it; Search Index Data Contributor would allow writes. The search service's own identity reads the PDFs, which needs Storage Blob Data Reader. Developers build and test with Foundry User, while Foundry Account Owner manages the resource and its keys without granting build actions.",
    syllabus: cite(SECURITY, "https://learn.microsoft.com/azure/foundry/concepts/rbac-foundry", "Role-based access control for Microsoft Foundry"),
  }),
  gaps({
    id: "cx-banking-06", caseStudyId: "banking", domain: "plan", topic: "Private name resolution",
    prompt: "Contoso Bank's branch application reaches the Foundry project from its own virtual network. Complete the Azure configuration.",
    template: "Create a {0} for the Foundry resource in the application's virtual network, link the {1} private DNS zone to that network so the project endpoint resolves to a private IP, and then set the resource's public network access to {2}.",
    blanks: [
      ["private endpoint", "service endpoint", "NAT gateway", "VPN gateway"],
      ["privatelink.services.ai.azure.com", "privatelink.search.windows.net", "privatelink.blob.core.windows.net"],
      ["Disabled", "Enabled from all networks", "Enabled for trusted services only"],
    ],
    explanation: "A private endpoint gives the Foundry resource a private IP in the network, and the privatelink.services.ai.azure.com zone makes the project host resolve to it; Foundry also uses the cognitiveservices and openai zones for its other hosts. The search.windows.net and blob.core.windows.net zones belong to Azure AI Search and Storage. A service endpoint, NAT gateway, or VPN gateway does not give the resource a private address, and public access stays Disabled to meet the constraint.",
    syllabus: cite(SECURITY, "https://learn.microsoft.com/azure/private-link/private-endpoint-dns", "Azure Private Endpoint private DNS zone values"),
  }),
  choose({
    id: "cx-banking-07", caseStudyId: "banking", domain: "extract", topic: "Regional security trimming",
    prompt: "A Contoso Bank loan officer in the Almaty region must see only that region's policy passages and only documents their Entra groups allow. Which two Azure AI Search request settings enforce this before content reaches the Foundry model? Each correct answer presents part of the solution.",
    options: [
      "A filter on the region field taken from the officer's verified profile",
      "A search.in filter on the ACL field using the officer's group IDs",
      "A semantic configuration that ranks regional passages above others",
      "A scoring profile that boosts documents tagged with the officer's region",
      "An agent instruction telling the model to ignore other regions",
    ],
    explanation: "Only filters remove documents before results are returned, so the region filter and the group-based search.in filter together enforce both rules. A semantic configuration and a scoring profile reorder results but still return other regions' passages, and an agent instruction acts after unauthorized text is already in the model context.",
    syllabus: cite("Connect retrieval pipelines directly to workflows and agent tools", "https://learn.microsoft.com/azure/search/search-security-trimming-for-azure-search", "Security trimming for Azure AI Search"),
  }),

  // --- Fabrikam Support (6) ---
  match({
    id: "cx-support-05", caseStudyId: "support", domain: "gen", topic: "Use case to tool behavior",
    prompt: "Match each Fabrikam Support use case to the behavior the Foundry agent should follow.",
    targets: [
      "A customer asks how to reset an FB-440 router",
      "A customer asks whether a device is under warranty",
      "A customer asks to extend warranty coverage",
    ],
    answers: [
      "Retrieve from the English manual index and cite the passage",
      "Call getWarranty directly under a read-only scope",
      "Draft updateWarranty and hold it for specialist approval",
    ],
    distractors: ["Answer from the model's pretrained knowledge", "Call updateWarranty immediately once the customer agrees"],
    explanation: "Reset steps must be grounded in the current English manual, so they come from retrieval with a citation. Warranty status is a read, which the agent can make directly under a read-only scope. An extension is a write that needs specialist confirmation, so the agent drafts it and waits; calling updateWarranty as soon as the customer agrees skips that approval, and pretrained knowledge is neither current nor citable.",
    syllabus: cite("Build autonomous or semiautonomous workflows with safeguards and approval flow controls", "https://learn.microsoft.com/azure/foundry/agents/concepts/tool-best-practice", "Best practices for using tools in Foundry Agent Service"),
  }),
  gaps({
    id: "cx-support-06", caseStudyId: "support", domain: "plan", topic: "Token budget controls",
    prompt: "Fabrikam's finance controller owns a fixed monthly token budget for the multilingual Foundry agent. Complete the cost design.",
    template: "Allocate a {0} rate limit to the deployment so bursts cannot outrun the plan, deploy {1} so short translation-only turns are served by a smaller model, and configure {2} to warn finance before the monthly budget is exhausted.",
    blanks: [
      ["tokens-per-minute", "images-per-minute", "concurrent-session"],
      ["model router", "a provisioned throughput reservation", "a Global Batch deployment"],
      ["an Azure Cost Management budget alert", "an Application Insights availability test", "an Azure AI Search indexer schedule"],
    ],
    explanation: "A tokens-per-minute allocation caps how fast a deployment can consume tokens. Model router sends simple prompts to smaller, cheaper models without code changes, while a provisioned reservation is a fixed commitment and Global Batch is asynchronous, which does not suit live chat. A Cost Management budget alert warns finance before spending runs out; an availability test and an indexer schedule do not measure spend.",
    syllabus: cite("Manage quotas, scaling, rate limits, and cost footprints for model and agent workloads", "https://learn.microsoft.com/azure/foundry/concepts/manage-costs", "Plan and manage costs for Microsoft Foundry"),
  }),

  // --- Northwind Media (7) ---
  gaps({
    id: "cx-media-05", caseStudyId: "media", domain: "vision", topic: "Mask-based editing",
    prompt: "A Northwind editor wants a winter background behind a product shot while the product itself stays untouched. Complete the Azure OpenAI gpt-image-1 request design.",
    template: "Send the source image and a mask to the {0} API. The mask must be a {1} with the same dimensions as the source, and its {2} pixels mark the background region the model may change.",
    blanks: [
      ["images edit", "images generate", "videos create"],
      ["PNG file", "JPEG file", "WebP file"],
      ["fully transparent", "fully black", "fully white"],
    ],
    explanation: "Localized changes use the images edit API with a mask. The mask must be a PNG with the source's dimensions, and its fully transparent pixels (alpha zero) mark where the model may edit. JPEG and WebP do not carry the alpha channel the mask relies on, black or white pixels do not mark the edit region, and images generate or videos create produce new content rather than editing the source.",
    syllabus: cite("Configure image-editing workflows, including inpainting, mask‑based edits, and prompt‑driven modifications", "https://learn.microsoft.com/azure/foundry/openai/how-to/dall-e", "Generate images with Foundry Models"),
  }),
  sequence({
    id: "cx-media-06", caseStudyId: "media", domain: "vision", topic: "Asynchronous video jobs",
    prompt: "Northwind's 12-second teaser must finish even if the editor closes the app. Arrange the Azure OpenAI Sora 2 steps in order.",
    steps: [
      "Create the job with videos.create and store the returned video ID",
      "Poll the video status until it is completed or failed",
      "Download the MP4 content for the completed video",
      "Save the asset and its provenance record to private Blob Storage",
    ],
    distractors: ["Hold the HTTP request open until the MP4 streams back", "Download the content first, then confirm the job status"],
    explanation: "Video generation is asynchronous: create the job, keep its ID in durable state, poll until the status reaches completed or failed, and only then download the content and store it privately with its provenance. Holding a request open ties completion to the editor's session, and downloading before the status is confirmed returns nothing usable.",
    syllabus: cite("Implement a solution that generates videos from text prompts and reference media", "https://learn.microsoft.com/azure/foundry/openai/concepts/video-generation", "Video generation with Sora 2"),
  }),
  choose({
    id: "cx-media-07", caseStudyId: "media", domain: "vision", topic: "Brand release gate",
    prompt: "Northwind's publication pipeline must reject assets that show a competitor's logo or lack the visible campaign watermark. Which two Azure controls belong in the release gate? Each correct answer presents part of the solution.",
    options: [
      "A Content Safety custom category trained on competitor-logo examples",
      "A deterministic check that confirms the watermark overlay is present",
      "A stricter violence severity threshold on the image content filter",
      "Negative wording about competitor logos added to the image prompt",
      "C2PA provenance metadata on each asset, used as proof of the mark",
    ],
    explanation: "A competitor logo is a brand rule outside the standard harm categories, so a custom category trained on examples detects it, and a deterministic check proves the visible watermark is present. A stricter violence threshold targets a different harm, negative prompt wording does not guarantee what the model draws, and C2PA metadata records provenance invisibly rather than proving a visible mark.",
    syllabus: cite("Enforce visual policy rules, such as applying watermarks, flagging prohibited symbols, upholding brand usage requirements, and detecting potentially inappropriate content", "https://learn.microsoft.com/azure/ai-services/content-safety/concepts/custom-categories", "Custom categories in Azure AI Content Safety"),
  }),

  // --- Alpine Health (8) ---
  gaps({
    id: "cx-healthcare-05", caseStudyId: "healthcare", domain: "extract", topic: "Analyzer field methods",
    prompt: "Alpine Health's referral analyzer must copy the medication dose verbatim, write a short reason for referral, and label urgency from a fixed list, with a confidence score and source region on every field. Complete the Azure Content Understanding analyzer definition.",
    language: "json",
    template: "{\n  \"baseAnalyzerId\": \"prebuilt-document\",\n  \"config\": { \"{0}\": true },\n  \"fieldSchema\": {\n    \"fields\": {\n      \"MedicationDose\": { \"type\": \"string\", \"method\": \"{1}\" },\n      \"ReferralReason\": { \"type\": \"string\", \"method\": \"{2}\" },\n      \"Urgency\": { \"type\": \"string\", \"method\": \"{3}\",\n                   \"enum\": [\"Routine\", \"Urgent\", \"Emergency\"] }\n    }\n  }\n}",
    blanks: [
      ["estimateFieldSourceAndConfidence", "enableFigureDescription", "enableFigureAnalysis"],
      ["extract", "generate", "classify"],
      ["generate", "extract", "classify"],
      ["classify", "extract", "generate"],
    ],
    explanation: "estimateFieldSourceAndConfidence returns a source region and a confidence score for every field, which the clinician-review rule depends on; enableFigureDescription and enableFigureAnalysis describe charts and images, and neither provides confidence. The dose must be copied as written, so it uses extract. The reason for referral is a synthesized summary, so it uses generate. Urgency must come from a fixed label set, so it uses classify with an enum.",
    syllabus: cite("Implement analyzers for generating structured or markdown outputs for downstream reasoning by using Content Understanding", "https://learn.microsoft.com/azure/ai-services/content-understanding/concepts/analyzer-reference", "What is a Content Understanding analyzer?"),
  }),
  match({
    id: "cx-healthcare-06", caseStudyId: "healthcare", domain: "language", topic: "Identifier handling",
    prompt: "Before Alpine Health's nightly export reaches the population-health dashboard, the data-protection officer requires identifiers to be handled as follows. Match each requirement to the Azure Language PII detection feature that meets it.",
    targets: [
      "Detect health identifiers such as medical record numbers",
      "Send the dashboard text with identifiers masked",
      "Limit detection to the categories the officer approved",
    ],
    answers: [
      "PII detection with the domain set to phi",
      "The redactedText value in the PII response",
      "The piiCategories parameter",
    ],
    distractors: ["Sentiment analysis with opinion mining", "Key phrase extraction", "Entity linking"],
    explanation: "Setting the domain to phi narrows PII detection to protected health information entities such as medical record numbers, the response's redactedText is the input with detected entities masked, and piiCategories restricts detection to the approved categories. Sentiment analysis, key phrase extraction, and entity linking analyze opinions, topics, and knowledge-base matches rather than identifiers.",
    syllabus: cite("Configure detection of sentiment, tone, safety issues, and sensitive content", "https://learn.microsoft.com/azure/ai-services/language-service/personally-identifiable-information/overview", "Detect personally identifiable information"),
  }),
  choose({
    id: "cx-healthcare-07", caseStudyId: "healthcare", domain: "plan", topic: "Unsupported statements",
    correctCount: 1,
    prompt: "Clinicians report that some Alpine Health summaries mention medication changes the referral packet never contains. Which Azure capability most directly flags these statements before a summary is released?",
    options: [
      "Groundedness detection against the extracted packet text",
      "Prompt Shields analysis of the clinician's request",
      "Protected material detection on each generated summary",
      "A stricter hate-category threshold on the model deployment",
      "Language detection on the Markdown that Content Understanding returns",
    ],
    explanation: "Groundedness detection compares the summary with its source material and flags claims the source does not support, which is exactly this defect. Prompt Shields looks for attacks in inputs, protected material detection finds copyrighted text, a hate-category threshold filters a harm category, and language detection only identifies the language.",
    syllabus: cite("Monitor model performance, drift, safety events, and grounding quality", "https://learn.microsoft.com/azure/ai-services/content-safety/concepts/groundedness", "Groundedness detection"),
  }),
  sequence({
    id: "cx-healthcare-08", caseStudyId: "healthcare", domain: "extract", topic: "Referral ingestion order",
    prompt: "Arrange the Azure steps for one faxed Alpine Health referral packet, from arrival to searchable content.",
    steps: [
      "Read the scan from private Storage with a managed identity",
      "Analyze it with the Content Understanding referral analyzer",
      "Send fields below the confidence threshold to clinician review",
      "Index the approved Markdown chunks with their page references",
    ],
    distractors: ["Publish the summary to the analytics queue before review", "Summarize the packet before its fields are extracted"],
    explanation: "The packet is read privately, analyzed into fields and Markdown, and any low-confidence field is reviewed by a clinician before the approved content is indexed with page references. Publishing to analytics before review would bypass both the clinician and the identifier checks, and summarizing before extraction leaves nothing reviewed to summarize from.",
    syllabus: cite("Configure RAG ingestion flow, including documents and using optical character recognition (OCR)", "https://learn.microsoft.com/azure/ai-services/content-understanding/document/overview", "Content Understanding document solutions"),
  }),

  // --- City Travel (7) ---
  gaps({
    id: "cx-travel-05", caseStudyId: "travel", domain: "language", topic: "SSML for voice replies",
    prompt: "City Travel's Azure Speech voice agent confirms a booking change. Complete the SSML design.",
    template: "Wrap the airport code ALA in a {0} element whose alias is \"Almaty International Airport\", add a {1} element before the confirmation question, and wrap the card's last four digits in a {2} element so each digit is read separately.",
    blanks: [
      ["<sub>", "<emphasis>", "<audio>"],
      ["<break>", "<bookmark>", "<lang>"],
      ["<say-as>", "<prosody>", "<voice>"],
    ],
    explanation: "The sub element speaks its alias in place of the written text, break inserts a pause, and say-as with interpret-as set to digits reads a number digit by digit. Emphasis changes stress, audio plays a clip, bookmark marks a position without pausing, lang switches language, prosody changes rate or pitch, and voice selects the speaker.",
    syllabus: cite("Implement workflows to convert speech to text and text to speech for agentic interactions", "https://learn.microsoft.com/azure/ai-services/speech-service/speech-synthesis-markup", "Speech Synthesis Markup Language"),
  }),
  match({
    id: "cx-travel-06", caseStudyId: "travel", domain: "language", topic: "Voice use cases",
    prompt: "Match each City Travel voice use case to the Azure Speech capability that addresses it.",
    targets: [
      "A caller switches from English to Spanish mid-call",
      "Airport and airline names are repeatedly misrecognized",
      "The caller hears the agent's confirmation",
    ],
    answers: [
      "Continuous language identification",
      "A phrase list, then custom speech if accuracy stays short",
      "Neural text to speech driven by SSML",
    ],
    distractors: ["Batch transcription with diarization", "Speaker recognition enrollment"],
    explanation: "Continuous language identification follows a caller who changes language during a call. A phrase list is the quickest fix for a few names, and a custom speech model follows if accuracy is still short. Neural text to speech with SSML voices the reply. Batch transcription runs after the call ends, and speaker recognition verifies identity rather than words.",
    syllabus: cite("Integrate speech as an agent modality, including custom speech models", "https://learn.microsoft.com/azure/ai-services/speech-service/language-identification", "Language identification with Speech"),
  }),
  choose({
    id: "cx-travel-07", caseStudyId: "travel", domain: "gen", topic: "Payment confirmation",
    prompt: "A City Travel caller asks to change the payment card on a booking. Which two controls make the explicit-confirmation constraint dependable for the Foundry voice agent? Each correct answer presents part of the solution.",
    options: [
      "Read the change back and require a spoken yes before the tool call",
      "Have the payment API reject calls that lack a confirmation token",
      "Lower the model temperature so it asks for confirmation more often",
      "State in the instructions that confirmation is usually expected",
      "Record the change in Application Insights once it has completed",
    ],
    explanation: "The agent reads the change back and waits for a spoken yes, and the payment API enforces the rule by rejecting calls without a confirmation token, so a model mistake cannot bypass it. A lower temperature and softer instructions only make confirmation more likely, and recording the change afterward documents it without preventing it.",
    syllabus: cite("Build autonomous or semiautonomous workflows with safeguards and approval flow controls", "https://learn.microsoft.com/azure/foundry/agents/concepts/tool-best-practice", "Best practices for using tools in Foundry Agent Service"),
  }),

  // --- Wide World Manufacturing (6) ---
  match({
    id: "cx-factory-05", caseStudyId: "factory", domain: "vision", topic: "Modality extraction",
    prompt: "Match each file in a Wide World Manufacturing upload to the Azure extraction output that the repair agent should index.",
    targets: ["A 40-minute inspection video", "An equipment manual PDF", "A photo of a warning label"],
    answers: [
      "Content Understanding video segments with timestamps",
      "Layout-aware Markdown with page numbers",
      "An image description with label text kept as untrusted evidence",
    ],
    distractors: ["Speech translation into the technician's language", "Custom text classification of the file name"],
    explanation: "Video analysis returns timestamped segments so answers can cite a moment, the manual becomes layout-aware Markdown with page numbers, and the photo yields a description whose label text is indexed as untrusted evidence. Speech translation changes language without making content retrievable, and classifying file names extracts nothing from the content.",
    syllabus: cite("Implement video analysis workflows to process and interpret video segments", "https://learn.microsoft.com/azure/ai-services/content-understanding/video/overview", "Content Understanding video solutions"),
  }),
  gaps({
    id: "cx-factory-06", caseStudyId: "factory", domain: "extract", topic: "Recovering failed items",
    prompt: "Five items in a Wide World Manufacturing upload failed during an Azure AI Search indexer run. Complete the recovery design so completed items are not reprocessed.",
    template: "Keep the indexer's {0} enabled so unchanged, already enriched documents are skipped, set {1} so a few failures do not stop the run, and use {2} to reprocess only the failed documents.",
    blanks: [
      ["incremental enrichment cache", "field mappings", "semantic configuration"],
      ["maxFailedItems", "batchSize", "queryTimeout"],
      ["reset documents", "reset indexer", "a new index"],
    ],
    explanation: "The incremental enrichment cache reuses skill outputs for unchanged documents, maxFailedItems lets a run continue past a small number of failures, and reset documents queues only the named documents for reprocessing. Resetting the whole indexer or building a new index reprocesses everything, and field mappings, semantic configuration, batchSize, and queryTimeout do not control recovery.",
    syllabus: cite("Ingest and index content, such as documents, images, audio, and video", "https://learn.microsoft.com/azure/search/cognitive-search-common-errors-warnings", "Indexer errors and warnings"),
  }),

  // --- Proseware Legal (8) ---
  gaps({
    id: "cx-legal-05", caseStudyId: "legal", domain: "extract", topic: "Hybrid clause query",
    prompt: "A Proseware associate asks for the limitation-of-liability clause in matter M-2291. The index has an integrated vectorizer on contentVector and a semantic configuration named clauses. Complete the Azure AI Search request.",
    language: "json",
    template: "{\n  \"search\": \"limitation of liability cap\",\n  \"vectorQueries\": [{ \"kind\": \"{0}\", \"text\": \"limitation of liability cap\",\n                     \"fields\": \"contentVector\", \"k\": 50 }],\n  \"filter\": \"matterId eq 'M-2291' and groupIds/any(g: {1}(g, 'g-17,g-42'))\",\n  \"queryType\": \"{2}\",\n  \"semanticConfiguration\": \"clauses\",\n  \"top\": 10\n}",
    blanks: [
      ["text", "vector", "imageUrl"],
      ["search.in", "search.ismatch", "search.score"],
      ["semantic", "full", "simple"],
    ],
    explanation: "A vector query of kind text sends the query string for the index's vectorizer to embed, while kind vector expects a precomputed embedding. search.in efficiently matches the associate's group IDs inside the filter; search.ismatch runs full-text search and search.score is not a filter function. Setting queryType to semantic applies the named semantic configuration to rerank the hybrid results; full and simple are keyword syntaxes only.",
    syllabus: cite("Configure semantic search, hybrid search, and vector search for grounding", "https://learn.microsoft.com/azure/search/hybrid-search-how-to-query", "Create a hybrid query in Azure AI Search"),
  }),
  match({
    id: "cx-legal-06", caseStudyId: "legal", domain: "gen", topic: "Choosing evaluators",
    prompt: "Proseware's knowledge team is comparing two index configurations. Match each question the team asks to the Foundry evaluator or metric that answers it.",
    targets: [
      "Did retrieval return the clauses the labeled set expects?",
      "Is every statement in the answer supported by retrieved text?",
      "Does the answer cover every obligation in the reference answer?",
      "Does the answer address what the associate asked?",
    ],
    answers: ["Document retrieval metrics", "Groundedness", "Response completeness", "Relevance"],
    distractors: ["Fluency", "Code vulnerability"],
    explanation: "Document retrieval metrics score ranked results against labeled relevance, groundedness checks claims against the retrieved context, response completeness compares coverage with a reference answer, and relevance measures whether the response addresses the query. Fluency judges readability and code vulnerability scans generated code, so neither separates the two configurations.",
    syllabus: cite("Evaluate models and apps, including detecting fabrications, relevance, quality, and safety", "https://learn.microsoft.com/azure/foundry/concepts/built-in-evaluators", "Built-in evaluators reference"),
  }),
  choose({
    id: "cx-legal-07", caseStudyId: "legal", domain: "extract", topic: "Revoked matter access",
    prompt: "A Proseware partner removes an associate from a matter's Entra group. Which two design elements make that matter disappear from the associate's later Azure AI Search results without reindexing? Each correct answer presents part of the solution.",
    options: [
      "Filter on the group claims in the associate's current token",
      "Store each chunk's permitted group IDs in a filterable field",
      "Cache each associate's permitted chunks for the whole working day",
      "Rebuild the index whenever a matter's group membership changes",
      "Ask the agent to decline matters the associate no longer works on",
    ],
    explanation: "Chunks carry their permitted group IDs in a filterable field, and each query filters on the group claims in the associate's current token, so a membership change takes effect as soon as the token reflects it, with no reindexing. A day-long cache keeps serving revoked content, rebuilding the index on every change is the cost the design avoids, and asking the agent to decline acts after the content has been retrieved.",
    syllabus: cite("Connect retrieval pipelines directly to workflows and agent tools", "https://learn.microsoft.com/azure/search/search-security-trimming-for-azure-search", "Security trimming for Azure AI Search"),
  }),
  sequence({
    id: "cx-legal-08", caseStudyId: "legal", domain: "extract", topic: "Clause enrichment pipeline",
    prompt: "Arrange the Azure AI Search enrichment steps that turn Proseware contracts into cited clause chunks.",
    steps: [
      "Crack each contract into Markdown sections with the Document Layout skill",
      "Split the sections into chunks with the Text Split skill",
      "Embed each chunk with the Azure OpenAI Embedding skill",
      "Write the chunks to the index through an index projection with matter metadata",
    ],
    distractors: ["Run language detection on each file name", "Merge every chunk back into one document per matter"],
    explanation: "Layout analysis comes first so tables and headings survive as Markdown, chunking follows the section boundaries, embeddings are computed per chunk, and an index projection writes each chunk as its own search document carrying matter metadata for filtering. Detecting the language of file names adds nothing, and merging chunks back into one document per matter undoes the chunking.",
    syllabus: cite("Implement enrichment by using custom or built-in skills for text, images, and layout", "https://learn.microsoft.com/azure/search/search-how-to-define-index-projections", "Define an index projection"),
  }),

  // --- Adventure Works Retail (6) ---
  gaps({
    id: "cx-retail-05", caseStudyId: "retail", domain: "language", topic: "Import-ready listings",
    prompt: "Adventure Works' catalog team needs import-ready JSON for 2,000 localized listings. Complete the Microsoft Foundry Responses API call.",
    language: "python",
    template: "response = client.responses.create(\n    model=\"catalog-writer\",\n    input=catalog_facts,\n    text={\"format\": {\"type\": \"{0}\", \"name\": \"listing\",\n                     \"schema\": listing_schema, \"{1}\": True}},\n)\nlisting = json.loads(response.{2})",
    blanks: [
      ["json_schema", "json_object", "text"],
      ["strict", "validate", "required"],
      ["output_text", "choices[0].message", "content"],
    ],
    explanation: "Structured outputs in the Responses API use a format of type json_schema with strict set to true, so the reply always conforms to the listing schema. json_object guarantees only valid JSON, not the required fields, and text applies no format. The result is read from output_text; choices[0].message belongs to Chat Completions, and validate and required are not format options.",
    syllabus: cite("Implement solutions to extract entities, topics, summaries, and structured JSON outputs by using generative prompting and Foundry Tools", "https://learn.microsoft.com/azure/foundry/openai/how-to/structured-outputs", "Structured outputs"),
  }),
  match({
    id: "cx-retail-06", caseStudyId: "retail", domain: "gen", topic: "Answer sources",
    prompt: "Match each Adventure Works shopper question to the source the Foundry shopping agent should use.",
    targets: [
      "What is this jacket made of, and how do I wash it?",
      "Is it in stock at the Astana store right now?",
      "What is my EU size 42 in US sizing?",
    ],
    answers: ["The Azure AI Search catalog index", "The OpenAPI inventory tool", "A deterministic size-conversion function"],
    distractors: ["The model's pretrained product knowledge", "Code Interpreter over last night's stock export"],
    explanation: "Materials and care instructions are stable catalog content retrieved from the index, live stock comes only from the inventory tool, and a size conversion is a fixed calculation best done by a deterministic function. Pretrained knowledge cannot be cited or kept current, and last night's stock export is already stale for a live stock question.",
    syllabus: cite("Integrate agent tools, including APIs, knowledge stores, search, content understanding, and custom functions", "https://learn.microsoft.com/azure/foundry/agents/concepts/tool-best-practice", "Best practices for using tools in Foundry Agent Service"),
  }),

  // --- Woodgrove Energy (7) ---
  gaps({
    id: "cx-energy-05", caseStudyId: "energy", domain: "gen", topic: "Exporting traces",
    prompt: "Woodgrove operations must see model, search, and tool spans for slow technician sessions in Application Insights. Complete the Python setup that runs at application startup.",
    language: "python",
    template: "from azure.monitor.opentelemetry import configure_azure_monitor\n\nproject = AIProjectClient(endpoint=PROJECT_ENDPOINT, credential=DefaultAzureCredential())\nconnection_string = project.{0}.get_application_insights_connection_string()\n{1}(connection_string=connection_string)",
    blanks: [
      ["telemetry", "connections", "deployments"],
      ["configure_azure_monitor", "setup_application_insights", "enable_telemetry_export"],
    ],
    explanation: "The project client's telemetry operations return the connection string of the Application Insights resource connected to the Foundry project, and configure_azure_monitor sets up OpenTelemetry export to it. Call it at startup, because spans emitted earlier are lost. The connections and deployments operations manage other project resources, and setup_application_insights and enable_telemetry_export are not functions in these libraries.",
    syllabus: cite("Set up observability by implementing tracing, token analytics, safety signals, and latency breakdowns", "https://learn.microsoft.com/azure/foundry/observability/how-to/trace-agent-setup", "How to set up tracing in Microsoft Foundry"),
  }),
  match({
    id: "cx-energy-06", caseStudyId: "energy", domain: "plan", topic: "Data zone deployments",
    prompt: "All Woodgrove processing must stay in the EU data zone. Match each workload to the Foundry Models deployment type that fits.",
    targets: [
      "Interactive technician chat with unpredictable traffic",
      "Nightly classification of 400,000 maintenance logs with a 24-hour turnaround",
      "A control-room assistant that needs reserved, predictable throughput",
    ],
    answers: ["Data Zone Standard", "Data Zone Batch", "Data Zone Provisioned"],
    distractors: ["Global Standard", "Global Batch"],
    explanation: "Data Zone deployments keep processing inside the chosen zone: Standard for pay-per-token interactive traffic, Batch for large asynchronous jobs at lower cost, and Provisioned for reserved throughput. Global Standard and Global Batch can process requests in any Azure region, which breaks the EU constraint.",
    syllabus: cite("Choose appropriate deployment options", "https://learn.microsoft.com/azure/foundry/foundry-models/concepts/deployment-types", "Deployment types for Microsoft Foundry Models"),
  }),
  choose({
    id: "cx-energy-07", caseStudyId: "energy", domain: "plan", topic: "Keyless field app",
    prompt: "Woodgrove's field application cannot store service keys. Which two design elements let technicians use the Foundry agent without keys on the tablets? Each correct answer presents part of the solution.",
    options: [
      "Sign technicians in with Entra ID and pass their token to the backend",
      "Have the backend call Foundry using its managed identity",
      "Embed an obfuscated Foundry key in the application package",
      "Keep the Foundry key in the tablet's hardware-backed keystore",
      "Give technicians one shared service account for the Foundry portal and app",
    ],
    explanation: "Technicians authenticate with Entra ID, and the backend calls Foundry with its managed identity and a least-privilege role, so no key ever reaches a device. An obfuscated or keystore-held key is still a key on the tablet, and a shared service account removes individual accountability while adding a password to protect.",
    syllabus: cite(SECURITY, "https://learn.microsoft.com/azure/foundry/concepts/authentication-authorization-foundry", "Authentication and authorization in Microsoft Foundry"),
  }),

  // --- Tailspin Insurance (8) ---
  sequence({
    id: "cx-insurance-05", caseStudyId: "insurance", domain: "gen", topic: "Settlement approval flow",
    prompt: "Arrange the Tailspin settlement workflow so that the Foundry agent can never pay without an adjuster's approval.",
    steps: [
      "The agent drafts the settlement and stores it as an immutable record",
      "The workflow requests adjuster approval that references the draft ID",
      "The adjuster approves and the workflow issues a scoped approval token",
      "The payment tool runs with the token and logs the approval ID",
    ],
    distractors: ["The agent pays first and the adjuster reviews afterward", "The handler edits the approved draft without a new review"],
    explanation: "An immutable draft gives the adjuster a fixed object to approve, the approval produces a token scoped to that draft, and the payment tool accepts only that token and records it for audit. Paying before review defeats the control, and editing an approved draft means the payment no longer matches what was approved.",
    syllabus: cite("Build autonomous or semiautonomous workflows with safeguards and approval flow controls", "https://learn.microsoft.com/azure/cloud-adoption-framework/ai-agents/build-secure-process", "Process to build agents across your organization"),
  }),
  gaps({
    id: "cx-insurance-06", caseStudyId: "insurance", domain: "extract", topic: "Estimate extraction",
    prompt: "Tailspin claims handlers need typed fields from repair estimates, with low-confidence amounts reviewed by a person. Complete the Azure design.",
    template: "Send each estimate to a {0} analyzer, turn on {1} so every field returns a source region and a score, and route any repair amount whose confidence falls below the {2} to manual review.",
    blanks: [
      ["custom Content Understanding", "Azure Translator document translation", "Azure AI Search OCR-only"],
      ["source and confidence estimation", "figure description output", "segment-level classification"],
      ["threshold agreed with adjusters", "model's default temperature", "index's semantic score"],
    ],
    explanation: "A custom Content Understanding analyzer returns typed claim fields, and source and confidence estimation (estimateFieldSourceAndConfidence) adds each field's source region and confidence score. A threshold agreed with adjusters decides which amounts need review. Translator document translation changes language, an OCR-only search skill returns text without typed fields, figure description and segment-level classification do not score fields, and temperature and semantic scores measure something else entirely.",
    syllabus: cite("Extract information by using multimodal pipelines that combine OCR, layout analysis, and field extraction", "https://learn.microsoft.com/azure/ai-services/content-understanding/document/overview", "Content Understanding document solutions"),
  }),
  choose({
    id: "cx-insurance-07", caseStudyId: "insurance", domain: "plan", topic: "Auditable, private traces",
    prompt: "Tailspin's internal audit must reconstruct every settlement, but claimant PII cannot appear in unrestricted Application Insights fields. Which two design elements meet both needs? Each correct answer presents part of the solution.",
    options: [
      "Record the approval ID, draft ID, and tool name as span attributes",
      "Redact names and card details before spans are exported",
      "Record full tool arguments with message content recording turned on",
      "Keep approval decisions only in each adjuster's mailbox",
      "Turn off tracing for any tool call that involves payments",
    ],
    explanation: "Identifiers such as the approval ID, draft ID, and tool name let audit rebuild each settlement without personal data, and redacting names and card details before export keeps PII out of the traces. Recording full arguments with content recording on copies the PII in, approvals kept in mailboxes cannot be joined to traces, and turning tracing off for payments removes the evidence audit needs.",
    syllabus: cite("Implement auditing through trace logging, provenance metadata, and approval workflows", "https://learn.microsoft.com/azure/foundry/observability/how-to/trace-agent-setup", "How to set up tracing in Microsoft Foundry"),
  }),
  match({
    id: "cx-insurance-08", caseStudyId: "insurance", domain: "vision", topic: "Photo risks",
    prompt: "Match each risk in Tailspin's vehicle photos to the Azure control that handles it.",
    targets: [
      "A photo contains graphic injury imagery",
      "A photo was edited to add damage that did not occur",
      "A photo includes text telling the agent to approve the claim",
    ],
    answers: [
      "Content Safety image analysis with a severity threshold",
      "A custom manipulation detector trained on Tailspin examples",
      "Prompt Shields on the extracted text before the agent reads it",
    ],
    distractors: ["Protected material detection for text", "Language detection on the claim form"],
    explanation: "Graphic content falls within standard harm categories, so Content Safety image analysis with a threshold handles it. Insurer-specific manipulation is outside those categories and needs a detector trained on Tailspin's examples. Text in an image that tries to command the agent is an indirect prompt injection, so Prompt Shields screens it first. Protected material detection finds copyrighted text, and language detection identifies languages.",
    syllabus: cite("Implement filters to classify unsafe or disallowed visual content", "https://learn.microsoft.com/azure/ai-services/content-safety/overview", "What is Azure AI Content Safety?"),
  }),

  // --- Contoso University (7) ---
  gaps({
    id: "cx-university-05", caseStudyId: "university", domain: "language", topic: "Translated captions",
    prompt: "Contoso University students need partial English captions with Spanish and French translations during lectures. Complete the Azure Speech SDK code.",
    language: "python",
    template: "config = speechsdk.translation.SpeechTranslationConfig(auth_token=token, region=REGION)\nconfig.speech_recognition_language = \"{0}\"\nfor language in (\"es\", \"fr\"):\n    config.{1}(language)\n\nrecognizer = speechsdk.translation.TranslationRecognizer(translation_config=config)\nrecognizer.{2}.connect(show_partial_caption)\nrecognizer.start_continuous_recognition()",
    blanks: [
      ["en-US", "en", "es-ES"],
      ["add_target_language", "set_speech_synthesis_language", "add_phrase"],
      ["recognizing", "recognized", "session_started"],
    ],
    explanation: "The recognition language takes a full locale such as en-US for the English lecture, and add_target_language adds each translation target. The recognizing event fires with interim results while the lecturer is still speaking, which is what partial captions need; recognized fires only for final results, and session_started marks the start of the session. Synthesis language and phrases configure other features.",
    syllabus: cite("Translate speech into other languages by using language models and Foundry Tools", "https://learn.microsoft.com/azure/ai-services/speech-service/speech-translation", "Speech translation"),
  }),
  match({
    id: "cx-university-06", caseStudyId: "university", domain: "language", topic: "Transcription modes",
    prompt: "Match each Contoso University use case to the Azure Speech transcription mode that fits it.",
    targets: [
      "Captions that appear while the lecture continues",
      "The two-hour recording, archived with speaker labels",
      "A one-minute recorded question that needs a transcript within seconds",
    ],
    answers: ["Real-time recognition with interim results", "Batch transcription with diarization", "Fast transcription"],
    distractors: ["Custom neural voice", "Pronunciation assessment"],
    explanation: "Real-time recognition streams interim results for live captions. Batch transcription processes long recordings asynchronously and can label speakers with diarization. Fast transcription returns a synchronous transcript faster than real time for short files. Custom neural voice creates a synthetic voice, and pronunciation assessment scores a speaker's pronunciation.",
    syllabus: cite("Implement workflows to convert speech to text and text to speech for agentic interactions", "https://learn.microsoft.com/azure/ai-services/speech-service/fast-transcription-create", "Fast transcription"),
  }),
  choose({
    id: "cx-university-07", caseStudyId: "university", domain: "language", topic: "Recurring domain terms",
    correctCount: 1,
    prompt: "A guest lecturer's pharmacology terms are still misrecognized after Contoso University added them to an Azure Speech phrase list, and the same terms recur every week. What should the team do next?",
    options: [
      "Train a custom speech model on course text and measure word error rate",
      "Switch live lecture captions to batch transcription instead",
      "Add the pharmacology terms to a Translator glossary only",
      "Turn on diarization so each speaker in the lecture is labeled",
      "Stream the lecture audio at a higher sample rate so the service hears more detail",
    ],
    explanation: "When a phrase list is not enough and the vocabulary recurs, a custom speech model trained on domain text improves recognition, and word error rate shows whether it worked. Batch transcription removes the live captions, a Translator glossary affects translation rather than recognition, diarization labels speakers without fixing words, and a higher sample rate does not teach the model new terms.",
    syllabus: cite("Integrate speech as an agent modality, including custom speech models", "https://learn.microsoft.com/azure/ai-services/speech-service/improve-accuracy-phrase-list", "Improve recognition accuracy with phrase lists"),
  }),

  // --- Litware Logistics (7) ---
  match({
    id: "cx-logistics-05", caseStudyId: "logistics", domain: "gen", topic: "Multi-agent behaviors",
    prompt: "Match each situation in Litware's Foundry multi-agent workflow to the behavior the orchestration should apply.",
    targets: [
      "Deciding which specialist handles a shipment question",
      "Routing and customs results disagree",
      "A specialist's customs tool call times out",
    ],
    answers: [
      "An orchestrator with a fixed set of connected specialists",
      "Escalate to an operator with both evidence sets",
      "Retry with the same idempotency key after a status check",
    ],
    distractors: ["Have the routing agent create a new customs agent at runtime", "Keep whichever specialist result arrived first"],
    explanation: "A fixed set of specialists behind an orchestrator honors the rule that no agent may create agents dynamically. Conflicting results go to a person with both evidence sets rather than being settled by arrival order. A timed-out update is checked and retried with the same idempotency key so it is not applied twice.",
    syllabus: cite("Implement orchestrated multi-agent solutions", "https://learn.microsoft.com/agent-framework/workflows/orchestrations/", "Workflow orchestrations"),
  }),
  gaps({
    id: "cx-logistics-06", caseStudyId: "logistics", domain: "gen", topic: "Safe retries",
    prompt: "A Litware customs update timed out, and the service may already have applied it. Complete the tool design for the Foundry agent.",
    template: "Each customs update carries an {0} header. After a timeout, the tool calls {1} with the same key and retries only if the service has no record of the operation.",
    blanks: [
      ["Idempotency-Key", "If-Modified-Since", "Retry-After"],
      ["the operation-status lookup", "the create endpoint with a fresh key", "the routing agent's message history"],
    ],
    explanation: "An idempotency key lets the service recognize a repeated request, and checking operation status with that key shows whether the timed-out update was applied before any retry. If-Modified-Since governs caching and Retry-After is a throttling hint. A fresh key guarantees a duplicate, and the routing agent's history does not know what the customs system committed.",
    syllabus: cite("Integrate agent tools, including APIs, knowledge stores, search, content understanding, and custom functions", "https://learn.microsoft.com/azure/foundry/agents/concepts/tool-best-practice", "Best practices for using tools in Foundry Agent Service"),
  }),
  choose({
    id: "cx-logistics-07", caseStudyId: "logistics", domain: "plan", topic: "Private indexer access",
    prompt: "Litware's Azure AI Search and Storage accounts have public network access disabled. Which two configurations let the search indexer read bills of lading from Storage without keys? Each correct answer presents part of the solution.",
    options: [
      "A shared private link from the search service to the storage account",
      "Storage Blob Data Reader for the search service's managed identity",
      "A storage account access key in the indexer's data source connection string",
      "A service endpoint on the operators' virtual network subnet",
      "A private endpoint from Storage into the Foundry virtual network",
    ],
    explanation: "A shared private link gives the search service an outbound private path to Storage, and its managed identity with Storage Blob Data Reader authenticates without a key. An account key breaks the keyless requirement, a service endpoint on the operators' subnet does nothing for the search service's outbound traffic, and a private endpoint into the Foundry network does not give the indexer a route to Storage.",
    syllabus: cite(SECURITY, "https://learn.microsoft.com/azure/search/search-howto-managed-identities-data-sources", "Managed identities for indexer connections"),
  }),
];
