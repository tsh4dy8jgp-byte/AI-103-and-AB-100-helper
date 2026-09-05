# Exam glossary

**133 terms across both exams**, grouped by the documentation tree each belongs to so this and the
[Learn lookup map](exam-reference-map.md) reinforce the same mental model.

Each definition is the shortest thing that separates the term from what it gets confused with.
Where a term has a habitual neighbour, it is named as **Not:**.

---

## Microsoft Foundry

`/azure/foundry/`

**AIProjectClient** — The client for Foundry-native project operations: connections, project properties, and tracing setup. <br>*Not: The OpenAI-compatible client, which owns responses, agents, evaluations, and fine-tuning.*

**Cloud evaluation** — Separates the evaluation definition from each run. Create the eval, create a run, poll to a terminal state, then retrieve scored results.

**Code interpreter** — Sandboxed Python execution that can run calculations over an uploaded file and emit artifacts such as charts. <br>*Not: File search, which returns passages and cannot compute or plot.*

**Continuous evaluation** — Samples live production traffic and scores it against quality metrics. The only thing that catches drift, since nothing else changed. <br>*Not: Predeployment evaluation, which runs only when a release happens.*

**Conversation identifier** — The service-side handle that lets a stateless tier resume a multi-turn conversation. Persist it bound to the signed-in user. <br>*Not: Replaying full prompt history, which works but re-bills every prior turn.*

**Data Zone** — Processing stays inside a named boundary such as the United States, European Union, or Asia Pacific. <br>*Not: Global types, which may process in any region the model is deployed to.*

**DefaultAzureCredential** — A credential chain that lands on the Azure CLI identity locally and on managed identity inside Azure. Code that works locally and fails in Azure usually has no identity assigned.

**Deployment name** — What you called the model when you deployed it. This is what runtime inference targets. <br>*Not: The catalog model name, which is what you picked from the shelf. The exam usually makes them differ.*

**Deployment type** — Answers three questions at once: where data is processed (global, data zone, or single region), how you pay (standard, provisioned, or batch), and the performance profile.

**Developer deployment** — For evaluating a fine-tuned model. Twenty-four hour lifetime, no service-level agreement, no data residency guarantee.

**Drift** — Answer quality degrading over months with no code change. Uptime, token totals, and latency all stay healthy while it happens.

**Evaluator** — A built-in or custom grader. Column mappings bind dataset fields to the input names an evaluator expects.

**File search** — Managed retrieval over uploaded files through a vector store, with chunking and embedding handled for you. <br>*Not: Azure AI Search, which you reach for when you need control over the index schema and query.*

**Fine-tuning** — Training a model on your own labeled data. Justified only when the task depends on private patterns no prompt can supply, and it creates permanent evaluation and retraining obligations.

**Foundry Account Owner** — Manages the resource: creates accounts, deploys models, rotates keys. Cannot build in projects without also holding Foundry User.

**Foundry Agent Consumer** — Least-privilege role for identities that only call an agent endpoint, without development access.

**Foundry Agent Service** — Hosts agents with instructions, tools, and conversation state, rather than you orchestrating the loop yourself.

**Foundry IQ** — A managed, permission-aware knowledge layer for agents, built on Azure AI Search. <br>*Not: Direct Azure AI Search, which you use when you need lower-level schema and query control.*

**Foundry project** — The scope everything else hangs off. Roles are granted on it, tracing is configured on it, and project-scoped calls inherit its content filters and tool context.

**Foundry project endpoint** — https://<resource>.services.ai.azure.com/api/projects/<project>. The host is services.ai.azure.com; the path ends in /api/projects/. <br>*Not: The Azure OpenAI resource endpoint, which is <resource>.openai.azure.com.*

**Foundry Toolbox** — A managed MCP endpoint for reusing a tool across agents and runtimes, with centralized credentials, versioning, and policy. Its tool search avoids sending every schema on every request.

**Foundry User** — The project data-plane role: build and test with pre-deployed models, no management writes. <br>*Not: Foundry Project Manager, which adds project creation, agent publishing, and model deployment.*

**Function calling** — The model returns a request to call your function with JSON arguments. Your code validates, authorizes, executes, and returns the result. The platform never runs your function.

**Global Batch** — Asynchronous processing at roughly half the price, with up to a 24-hour turnaround.

**Global Standard** — Any region, pay per token. The default starting point: highest quota, broadest model availability, and new models land here first.

**HTTP 429** — Too many requests. Honor Retry-After, back off with bounded exponential delay plus jitter, and queue or shed load rather than retrying immediately.

**Inpainting** — Mask-based image editing. The mask defines the region to change; pixels outside it must be preserved.

**Microsoft Foundry** — The platform holding your models, agents, evaluations, tracing, connections, and project. The project is the unit of scope: access, tracing, content filters, and tools all attach to it.

**Model Context Protocol** — MCP. A standard for exposing a catalog of tools from several back-end systems through one protocol. The server keeps enforcing authentication and authorization.

**Model router** — A single deployment that picks an underlying model per request based on prompt complexity. Modes are balanced, cost, and quality.

**Model subset** — The allow-list of models a router may select from. It doubles as the failover set, so pick at least two.

**OpenAI-compatible client** — Obtained from the project client via get_openai_client() in Python or getOpenAIClient() in JavaScript. Owns the OpenAI-shaped surface. <br>*Not: AIProjectClient, which owns project metadata rather than inference.*

**output_text** — Convenience property aggregating the text output items of a response into one string.

**Provisioned throughput** — Reserved capacity sized in PTUs, giving predictable latency. PTUs are model-independent and region-specific, and the throughput a given count delivers varies by model. <br>*Not: Standard, which is pay-per-token with no reservation.*

**Quota** — Capacity scoped by subscription, region, model, and offer. Unused capacity in one region does not help another.

**Reasoning effort** — How much internal deliberation a reasoning model performs on a request. Lower it for simple lookups. <br>*Not: Reasoning mode (standard or pro), which is a separate control.*

**Remix** — Applies one targeted change to a completed video by its identifier, preserving framing, motion, and scene structure. <br>*Not: Regenerating from the original prompt, which discards the approved composition.*

**Responses API** — The inference surface. client.responses.create(model=..., input=...). The model field takes the deployment name, not the catalog model name. <br>*Not: Chat Completions, the older surface where a schema goes in response_format rather than text.format.*

**Small language model** — A narrow, cheap, fast model. The right answer when volume is high, the task is fixed, and offline testing already shows sufficient accuracy.

**Sora 2** — Video generation. Create returns a job you poll to a terminal state, then download.

**Structured outputs** — Constrains a response to a JSON Schema. Strict adherence needs every property listed as required and additionalProperties set to false. <br>*Not: JSON mode, which guarantees valid JSON but not your schema.*

**Task adherence** — The Foundry agent evaluator measuring whether the agent followed its instructions and acted at the right time. <br>*Not: Azure AI Content Safety, which assesses content harm rather than whether an action was appropriate.*

**Trace and span** — A trace is one end-to-end operation; a span is one step inside it. Per-span token counts are what localize cost or latency to a step.

**Vector store** — The managed container file search retrieves from. Superseded files must be deleted from it or they keep being returned.

---

## Azure AI Search

`/azure/search/`

**Agentic retrieval** — A multi-query pipeline: a knowledge base plans subqueries, runs them in parallel across knowledge sources, reranks, and returns merged content with references. <br>*Not: Classic RAG, which is a single hybrid query with semantic ranking.*

**Chunking** — Subdividing large documents so portions match independently. If you want to cite a page or timestamp, the chunk must carry it as a retrievable field.

**Custom skill** — Your own code called over HTTP during enrichment. The way to bring proprietary logic into indexing.

**Data source** — Where the content actually lives: Blob Storage, a database, SharePoint, and so on.

**Hybrid search** — Runs keyword and vector queries in parallel in one request and fuses the results. The standard answer when you need both exact-token recall and paraphrase.

**Index** — The searchable structure: fields, types, and attributes such as searchable, filterable, and retrievable. <br>*Not: The indexer, which is the process that fills it.*

**Index projection** — Maps one enriched source document to many child chunk documents, keeping parent-child relationships and provenance.

**Indexer** — Pulls from a data source, runs the skillset, and writes into the index, on a schedule or on demand. Its execution history is where stalled ingestion shows up.

**Integrated vectorization** — Azure AI Search generates the embeddings during indexing via a configured vectorizer, rather than you computing them and pushing them in.

**Knowledge base** — Orchestrates agentic retrieval: references knowledge sources and defines retrieval behavior. <br>*Not: A knowledge source, which defines the content itself.*

**Knowledge source** — Defines content for retrieval. Indexed sources are backed by a search index; remote sources are queried live from an external platform.

**OData filter** — Restricts the result set. Built from verified identity claims, this is the mechanism behind security trimming.

**Reciprocal Rank Fusion** — RRF. The algorithm that merges the parallel keyword and vector result sets into one ranked list.

**Retrieval reasoning effort** — Controls how much planning the pipeline does: minimal skips the planning model entirely, low is the default, medium maximizes relevance.

**Scoring profile** — Boosts specific fields or criteria at query time.

**Security trimming** — Filtering retrieval by verified identity before generation, so unauthorized content never enters model context. <br>*Not: Instructing the model to omit content, which means it was already retrieved.*

**Semantic ranker** — Level-two reranking that re-scores merged results by meaning. Requires a semantic configuration naming the title and content fields. <br>*Not: Hybrid search, which is about running both query types; the ranker is about reordering what comes back.*

**Skillset** — The enrichment pipeline the indexer runs, made of built-in and custom skills. Skills run at indexing time. <br>*Not: Scoring profiles and synonym maps, which act at query time.*

**vectorFilterMode** — preFilter applies the filter before the vector search, which is what you want when the filter is highly selective and you cannot afford to miss matches. <br>*Not: postFilter, which filters after and can return too few results.*

**Vectorizer** — The component that turns query text into a vector at query time. It must match the embedding model and vector profile used at indexing time.

---

## Foundry Tools and Azure AI services

`/azure/ai-services/`

**Alt text** — A concise, purpose-aware description written for someone who cannot see the image. A generation task. <br>*Not: A search semantic caption, which explains query relevance, and a Content Safety label, which names a harm category.*

**Analyzer** — The unit of Content Understanding configuration. Its field schema defines what structured data comes out.

**Audio-enabled model** — Accepts the recording itself as input, so prosody and delivery reach the model. Needed when the signal is acoustic rather than lexical. <br>*Not: A transcript, which discards everything but the words.*

**Azure AI Content Safety** — Harm detection: content filters, blocklists, groundedness detection, protected material detection, and Prompt Shields.

**Azure Content Understanding** — Extraction from documents, images, video, and audio into typed fields plus clean markdown.

**Azure Speech** — Speech to text, text to speech, translation, diarization, and custom speech.

**Azure Translator** — Text translation is synchronous, for strings. Document Translation is asynchronous, for whole files with formatting preserved.

**Batch transcription** — Asynchronous transcription of long prerecorded audio. Pair with diarization for speaker labels. <br>*Not: Fast transcription, which is synchronous for prerecorded audio you want back in one call.*

**Classifier** — Splits one file containing several documents into logical documents and routes each to a field-extraction analyzer. <br>*Not: Pro mode, which reconciles across separate documents rather than splitting one.*

**Content filter** — Severity thresholds across the standard harm categories, configured per deployment. <br>*Not: A blocklist, which covers your own terms that the standard categories do not.*

**Continuous recognition** — Real-time recognition emitting recognizing events for interim partial text and recognized events for final text per segment. <br>*Not: Batch transcription, which is asynchronous and for long prerecorded audio.*

**Custom Translator** — Trains and publishes a domain model so brand names and industry terminology survive translation.

**Diarization** — Speaker labeling: which speaker said which phrase.

**Field method** — Per-field extraction behavior. extract copies a value as it appears, generate synthesizes an interpretive value, classify chooses from a set.

**Foundry Tools** — The purpose-built services: Content Understanding, Content Safety, Speech, Translator, Language. Reach for one when the requirement wants an auditable, versioned contract rather than free-form model judgment.

**Groundedness detection** — Checks whether a generated claim actually appears in the supplied source material. The fabrication check.

**Indirect prompt injection** — Instructions hidden in content the system reads — a document, an image's embedded text, a tool response. Treat retrieved text as data, never as instruction.

**Language identification** — Detects which language is being spoken from a bounded candidate list. Constraining the candidates matters for latency.

**Layout-aware Markdown** — Output preserving heading levels and table structure, so downstream reasoning keeps the structure that carries meaning.

**Phrase list** — A lightweight runtime hint improving recognition of a small set of specific terms. The first thing to try. <br>*Not: Custom speech, which trains a model and is warranted only when broader domain errors remain.*

**PII detection** — Azure AI Language capability finding personally identifiable information, used to redact before storage or downstream processing.

**Pro mode** — Content Understanding mode adding reasoning across multiple input documents plus an external knowledge base for linking and validation. <br>*Not: Standard mode, which analyzes one file at a time. Also unrelated to reasoning-model pro mode.*

**Prompt Shields** — Detects prompt injection, both direct jailbreak attempts and indirect injection arriving through documents, images, or tool output.

**SSML** — Speech Synthesis Markup Language. Controls pronunciation, emphasis, pauses, and rate in text to speech.

---

## Copilot Studio

`/microsoft-copilot-studio/`

**Agent evaluation** — Runs a reusable, versioned test set and scores it, which is what makes two agent versions comparable across releases. <br>*Not: Test chat, which is exploratory and not repeatable.*

**Agent flow** — Deterministic multi-step automation with branching and connector calls that participates in Power Platform solutions and ALM. <br>*Not: A topic, which handles conversation rather than execution.*

**Authenticate with Microsoft** — Supplies Microsoft 365 and Teams identity properties such as User.ID and User.DisplayName. <br>*Not: Authenticate manually, which is the only option that exposes User.AccessToken.*

**Autonomous agent** — Reacts to a configured event trigger with no user in the conversation. Requires scoped permissions, decision boundaries, and auditability.

**Classic orchestration** — Deterministic routing: the utterance matches authored trigger phrases and one topic executes.

**Computer use** — Automates applications and websites that expose no programmable interface, by driving the interface as a person would.

**Connected agent** — A separate agent with its own orchestration, tools, and permissions. Its context-inclusion setting controls whether it receives conversation history. <br>*Not: A child agent, which always receives the parent's context.*

**Fallback topic** — The system topic handling utterances that match no topic. Where escalation is authored under classic orchestration.

**Generative orchestration** — Plans across multiple topics, tools, connected agents, and knowledge in one interaction. Selection is driven by component names and descriptions. <br>*Not: Classic orchestration, which matches an utterance to one authored topic.*

**Prompt action** — Runs a reusable prompt as one step inside a topic, with typed inputs and outputs available to the rest of the flow.

**Publish** — Authentication and configuration changes take effect when the agent is published, not when the settings pane is saved.

**Topic** — A conversational unit with trigger phrases, nodes, and variables. Returns a typed output when the orchestrator needs to combine its result with other components.

**User.AccessToken** — The signed-in user's token, available only with manual authentication. Needed for on-behalf-of calls from a topic.

**Variable scope** — Topic scope stays inside one topic and exposes values only through explicit outputs; global is shared across a session; user persists across sessions.

---

## Business applications and governance

`/dynamics365/ · /power-platform/`

**AI Builder** — Power Platform's low-code AI capability, including prompts invoked from a canvas app so a draft returns into the form.

**AI Center of Excellence** — Scales governance through shared standards, reusable assets, and enablement rather than headcount. Not an approval board and not a central build team.

**Build, buy, or extend** — Favors the smallest custom surface that meets the requirement. Extending one gap keeps vendor support; rebuilding transfers permanent maintenance.

**Business terms** — A curated organizational vocabulary so domain abbreviations resolve consistently in Dynamics 365 Copilot rather than being guessed per conversation.

**Cloud Adoption Framework** — The AI adoption sequence: strategy, then plan, then ready, with govern and manage running continuously alongside adoption.

**Connection reference** — Keeps credentials outside the solution so one managed package promotes cleanly between environments.

**Copilot for Sales and for Service** — Role-specific experiences that pair with their audiences. Both read the same customer record system, so that connection is configured once.

**Copilot hub** — The Copilot area of the Power Platform admin center: usage insight and governance controls for AI features across environments.

**Data policy** — Power Platform DLP. Enforces which connectors, channels, and knowledge sources may be combined, at environment scope, regardless of maker intent.

**Dataverse** — The governed data platform behind Power Platform. Row-level authorization is enforced by its security roles in the signed-in user's context, never by agent instructions.

**Environment variable** — An ALM construct resolved per environment, keeping endpoints outside the deployable logic. <br>*Not: A global variable, which is conversation state within a session.*

**In-app help and guidance** — Generative help in finance and operations apps, which can be supplemented with the organization's own approved documentation alongside product content.

**Managed Environment** — Applies stronger governance selectively to the environments where risk is highest, without slowing experimentation elsewhere.

**Microsoft 365 Copilot** — The employee-facing surface. Retrieval runs in the signed-in user's context, so existing permissions are enforced by the platform.

**Microsoft Purview** — Discovery, classification, and policy across AI interactions, which is what compliance needs rather than per-agent logs.

**Power Platform pipelines** — Promote managed solutions between environments with checks, rather than importing unmanaged solutions directly into production.

**Power Platform Well-Architected** — The framework for intelligent application workloads. Trade-offs between pillars are decided deliberately and recorded with their rationale.

**Prebuilt agent** — A supported capability that shortens time to value. Adopt it and scope build effort to the genuine remainder.

**Task agent** — Carries a bounded, repeatable process to completion, pausing cleanly when the process leaves its bounds. <br>*Not: A conversational assistant, where a person still drives the outcome.*

**Total cost of ownership** — Build plus platform consumption plus the recurring cost of monitoring, evaluating, and tuning. The recurring part is what a first ROI model usually omits.

---

## Cross-cutting principles


**Access review** — Periodic comparison of granted scope against current need, because access granted at launch drifts as reasons change.

**ALM** — Application lifecycle management. Agent definitions, prompts, tool configuration, grounding data, and infrastructure are all versioned artifacts that move together.

**Approval boundary** — Durable state changed only through an authorized path. An agent marking its own work approved, a safety scan, or a conversation-settable flag are not approvals.

**Audit trail** — Who changed what, when, and which version was live for each decision, held append-only outside the control of the team it records.

**Data residency** — Holds only if every processing and storage point honors it, including telemetry destinations, which teams most often overlook.

**Enforced outside the model** — The recurring principle: authorization lives in code and identity, never in instructions, content filters, or sampling parameters. It answers more exam questions than any single service name.

**Held-out data** — Data withheld from training, the only basis for estimating how a model behaves on cases it has not seen. <br>*Not: Training-set scores, which overstate performance.*

**Idempotency key** — Makes a state-changing call safe to retry after an uncertain timeout. Pair it with an operation-status lookup before retrying.

**Managed solution** — The controlled, reversible promotion path with checks before production. <br>*Not: An unmanaged solution, which imported directly into production removes that boundary.*

**Separation of duties** — No single identity should author, approve, and change the data a release depends on.

**Shadow evaluation** — Running a candidate model on live traffic without serving its answers, to compare it against production with no user exposure.

---
