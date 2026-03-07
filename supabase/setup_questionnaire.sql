-- ============================================================
-- LexSutra — Complete Questionnaire Setup
-- Run this in Supabase SQL Editor (safe to re-run)
-- Fixes missing columns + seeds all 80 questions with rich metadata
-- Incorporates the 5 key classification questions (first 5 of Risk Management)
-- ============================================================

-- ── Step 1: Fix missing columns ───────────────────────────────

ALTER TABLE diagnostic_questions
  ADD COLUMN IF NOT EXISTS order_index  INT          DEFAULT 0,
  ADD COLUMN IF NOT EXISTS question_type TEXT         DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS metadata     JSONB         DEFAULT '{}';

ALTER TABLE diagnostic_responses
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT;

-- ── Step 2: Clear existing questions (clean slate) ────────────

TRUNCATE diagnostic_questions CASCADE;

-- ── Step 3: Seed 80 questions with rich metadata ──────────────
-- Organised by obligation. Risk Management starts with the 5 key
-- classification questions that drive Annex III determination.

WITH obligation_ids AS (
  SELECT id,
    CASE
      WHEN title ILIKE '%Risk Management%'        THEN 'risk_mgmt'
      WHEN title ILIKE '%Data Governance%'         THEN 'data_gov'
      WHEN title ILIKE '%Technical Documentation%' THEN 'tech_doc'
      WHEN title ILIKE '%Logging%'                 THEN 'logging'
      WHEN title ILIKE '%Transparency%'            THEN 'transparency'
      WHEN title ILIKE '%Human Oversight%'         THEN 'human_oversight'
      WHEN title ILIKE '%Accuracy%'                THEN 'accuracy'
      WHEN title ILIKE '%Conformity%'              THEN 'conformity'
    END AS key
  FROM obligations
),

questions (obligation_key, order_index, question_text, question_type, metadata) AS (
  VALUES

  -- ═══════════════════════════════════════════════════════════
  -- Article 9 — Risk Management System
  -- Questions 1–5: The 5 key classification questions
  -- Questions 6–10: Risk management obligations
  -- ═══════════════════════════════════════════════════════════

  ('risk_mgmt', 1,
   'What is the intended purpose of your AI system?',
   'text',
   '{"critical":true,"placeholder":"Describe what the system does, who it serves, and the decisions it makes or supports.","help_text":"This is the single most important question in your assessment. The answer determines your Annex III risk category. Be specific: describe the task, the target users, and whether the system''s output influences decisions about individual people."}'
  ),

  ('risk_mgmt', 2,
   'Does your AI system influence or make decisions that directly affect individual people?',
   'yes_no',
   '{"critical":true,"help_text":"Answer yes if the system''s output affects employment, creditworthiness, insurance, education access, healthcare, law enforcement, migration status, or social benefits — even if a human also reviews the decision. This triggers Annex III high-risk classification."}'
  ),

  ('risk_mgmt', 3,
   'Who developed the AI system?',
   'select',
   '{"critical":true,"options":["Built entirely in-house by our engineering team","Third-party vendor — we licence and deploy it","Open source model — we fine-tuned or deployed it","Combination of in-house development and third-party components"],"help_text":"This determines whether you carry provider obligations (Article 16) or deployer obligations (Article 25), or both. If you deployed someone else''s model, you are a deployer. If you built it, you are a provider."}'
  ),

  ('risk_mgmt', 4,
   'When the system produces an output, who or what makes the final decision?',
   'select',
   '{"critical":true,"options":["Fully automated — the system acts without any human review","A human reviews outputs but rarely intervenes or overrides","A human always reviews and can reject the output before it takes effect","A human makes the final decision; the AI only provides a recommendation or information"],"help_text":"This is critical for Article 14 compliance. ''Human in the loop'' that never overrides does not satisfy the human oversight requirement. The AI Act requires that humans can meaningfully intervene and override the system."}'
  ),

  ('risk_mgmt', 5,
   'Is this AI system deployed in the EU, or does it make decisions affecting EU residents?',
   'yes_no',
   '{"critical":true,"help_text":"Answer yes if any of the people whose data is processed, or who are subject to the system''s outputs, are located in the EU — regardless of where your company is headquartered. The EU AI Act applies based on where the impact occurs, not where the company is registered."}'
  ),

  ('risk_mgmt', 6,
   'Does your organisation have a documented AI risk management system specific to this AI system?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your AI risk management framework, risk register, or equivalent documentation.","help_text":"A general IT risk policy does not satisfy Article 9. The risk management system must be specific to the AI system, cover its full lifecycle, and be regularly updated. It must document identified risks, estimated probability, and mitigation measures."}'
  ),

  ('risk_mgmt', 7,
   'How frequently is your AI risk management process reviewed and updated?',
   'select',
   '{"options":["Continuously (built into our development and deployment process)","After every significant system change or update","Quarterly","Annually","Ad-hoc — reviewed only when a problem arises","Not yet reviewed or established"],"help_text":"Article 9 requires an iterative, ongoing process — not a one-time assessment. Documenting the review schedule and evidence of reviews strengthens compliance."}'
  ),

  ('risk_mgmt', 8,
   'Have you identified and documented foreseeable misuse cases for your AI system?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload documentation of identified misuse scenarios and mitigations.","help_text":"Article 9 requires you to consider not just intended use but also reasonably foreseeable misuse — including misuse by third parties. Examples: using a hiring tool to systematically exclude a protected group, or gaming a fraud detection system."}'
  ),

  ('risk_mgmt', 9,
   'Are risk mitigation measures documented, tested, and their effectiveness tracked over time?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload evidence of tested mitigation measures (test reports, review logs, etc.).","help_text":"Identifying a risk without a documented, tested mitigation does not satisfy Article 9. You must show that mitigations work and continue to be monitored."}'
  ),

  ('risk_mgmt', 10,
   'Is there a named individual or team formally responsible for AI risk management in your organisation?',
   'yes_no',
   '{"help_text":"Accountability must be assigned to a specific person with the authority and expertise to act on identified risks. This person does not need to be a lawyer — but they must understand the AI system and have the power to halt deployment if necessary."}'
  ),

  -- ═══════════════════════════════════════════════════════════
  -- Article 10 — Data Governance
  -- ═══════════════════════════════════════════════════════════

  ('data_gov', 1,
   'What types of data does your AI system use for training, validation, and testing?',
   'text',
   '{"placeholder":"Describe the data types, sources, and approximate volume used in each phase.","help_text":"Article 10 requires training, validation, and testing datasets to be treated as separate categories. Describe each. Include: data type (text, images, structured records), origin (proprietary, licensed, scraped, synthetic), and whether personal data is involved."}'
  ),

  ('data_gov', 2,
   'Do you maintain documentation of your training datasets including their provenance and key characteristics?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your dataset documentation, data card, or data governance policy.","help_text":"Article 10 requires documentation covering: how data was collected, from where, over what time period, its subject matter, and any known limitations. Dataset documentation (''data cards'') are a practical way to demonstrate this."}'
  ),

  ('data_gov', 3,
   'Have you conducted a formal assessment of your training data for potential biases that could lead to discriminatory outputs?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload bias assessment reports, fairness audit results, or test outputs.","help_text":"Article 10 explicitly requires examination of datasets for possible biases that could cause discriminatory outcomes. The assessment must cover protected characteristics: gender, age, race, disability, religion. A one-time assessment is not sufficient — it must be repeated when data changes."}'
  ),

  ('data_gov', 4,
   'If personal data is used, describe how data minimisation and purpose limitation are enforced.',
   'text',
   '{"placeholder":"Explain what personal data is used, why it is necessary, and how access is controlled.","help_text":"If your system processes personal data, you must comply with GDPR alongside the AI Act. Data used for training must be limited to what is strictly necessary for the AI system''s purpose. Describe your privacy-by-design measures."}'
  ),

  ('data_gov', 5,
   'Do you have data governance policies covering collection, storage, retention, access control, and deletion?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your data governance policy or data management framework.","help_text":"A comprehensive data governance policy should cover: what data is collected, where it is stored, who can access it, how long it is retained, and how it is deleted. AI-specific provisions (covering training data) should be included."}'
  ),

  ('data_gov', 6,
   'Is personally identifiable information (PII) used during training or as input at inference time?',
   'yes_no',
   '{"help_text":"If yes, you will need to demonstrate lawful basis for processing, data minimisation, and adequate safeguards. PII in training data creates ongoing compliance obligations even after the model is trained, because the model may inadvertently memorise and reproduce that data."}'
  ),

  ('data_gov', 7,
   'How is data quality monitored on an ongoing basis after the model is deployed?',
   'text',
   '{"placeholder":"Describe your process for detecting and addressing data quality issues in production.","help_text":"Production data drift (changes in the distribution or quality of data the model receives) can cause performance degradation and introduce new biases. Describe automated and manual monitoring processes."}'
  ),

  ('data_gov', 8,
   'Do you have a documented process for correcting, updating, or removing inaccurate or outdated training data?',
   'yes_no',
   '{"help_text":"Article 10 requires datasets to be examined for errors and corrected where possible. This implies ongoing data quality management, not just one-time validation. Describe how errors reported by users or detected through monitoring are handled."}'
  ),

  ('data_gov', 9,
   'Where is your training and operational data stored, and under which legal jurisdiction?',
   'text',
   '{"placeholder":"e.g. AWS eu-west-1 (Ireland), on-premises in Netherlands, Google Cloud Europe.","help_text":"Data storage location affects GDPR compliance and data sovereignty. All data used by systems subject to EU AI Act should ideally be stored within the EU/EEA. Cross-border data transfers require appropriate safeguards."}'
  ),

  ('data_gov', 10,
   'Do you conduct regular bias audits across protected demographic characteristics, and are the results documented?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload bias audit reports, fairness metric results, or third-party audit findings.","help_text":"Protected characteristics under EU non-discrimination law include: gender, racial or ethnic origin, religion, disability, age, and sexual orientation. Bias audits should test whether the system produces measurably different outcomes across these groups."}'
  ),

  -- ═══════════════════════════════════════════════════════════
  -- Article 11 & Annex IV — Technical Documentation
  -- ═══════════════════════════════════════════════════════════

  ('tech_doc', 1,
   'Do you maintain technical documentation describing the AI system''s design, development methodology, and architecture?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your technical documentation, system architecture document, or model card.","help_text":"Article 11 and Annex IV require documentation covering exactly 9 areas. A developer wiki or README does not satisfy this requirement — the documentation must be structured to address each Annex IV item specifically."}'
  ),

  ('tech_doc', 2,
   'Does your documentation cover the intended purpose, conditions of use, and the categories of persons affected?',
   'yes_no',
   '{"help_text":"Annex IV item 1 requires a general description including: the AI system''s intended purpose, the level of accuracy and performance, and the categories of natural persons and groups on which the system is intended to be used."}'
  ),

  ('tech_doc', 3,
   'Is your system architecture, including model type, training procedure, and the interaction between components, documented?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload architecture diagrams, training pipeline documentation, or system design documents.","help_text":"Annex IV item 2 requires documentation of the design specifications, the training methodology, training data characteristics, and the overall logic of the system. For third-party models, you must document how you integrated them."}'
  ),

  ('tech_doc', 4,
   'Are your validation and testing methodology, metrics, and test results documented?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload test reports, validation results, benchmark comparisons, or evaluation methodology.","help_text":"Annex IV item 5 requires documentation of the validation and testing procedures applied, the metrics used, and the results achieved. Test results must be reproducible and available to competent authorities."}'
  ),

  ('tech_doc', 5,
   'Are cybersecurity measures applied to the AI system documented?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your cybersecurity assessment, penetration test results, or security architecture documentation.","help_text":"Annex IV item 6 requires documentation of cybersecurity measures taken to protect the AI system against adversarial manipulation, data poisoning, and unauthorised access. This includes both the training pipeline and the inference environment."}'
  ),

  ('tech_doc', 6,
   'Does your documentation include known limitations, performance boundaries, and conditions under which the system may fail?',
   'yes_no',
   '{"help_text":"Annex IV requires explicit documentation of known limitations — particularly edge cases, out-of-distribution inputs, and demographic groups where performance may be lower. This is also required for the instructions for use (Article 13). Documenting limitations is not an admission of non-compliance — it demonstrates transparency."}'
  ),

  ('tech_doc', 7,
   'How is technical documentation maintained and kept current when the AI system is changed or updated?',
   'text',
   '{"placeholder":"Describe your documentation versioning process and who is responsible for updates.","help_text":"Technical documentation must be kept up to date throughout the AI system''s lifecycle. Describe your version control process for documentation, who is responsible for updates, and how changes to the system trigger documentation reviews."}'
  ),

  ('tech_doc', 8,
   'Is your technical documentation accessible to competent authorities upon formal request?',
   'yes_no',
   '{"help_text":"Article 11 requires that technical documentation be available to national competent authorities upon request. This does not mean it must be publicly available — but you must be able to produce it within a reasonable timeframe if required by a regulator."}'
  ),

  ('tech_doc', 9,
   'If your AI system uses a third-party foundation model or component, have you documented the integration and any modifications?',
   'text',
   '{"placeholder":"Describe any third-party AI components used, how they are integrated, and any fine-tuning applied.","help_text":"If you are deploying a third-party model (e.g. a LLM, computer vision API, or scoring model), you carry documentation obligations for the integration layer and any customisation. Document: which components are used, their version, the integration architecture, and any fine-tuning performed."}'
  ),

  ('tech_doc', 10,
   'Do you use version control for your technical documentation, and can you retrieve historical versions?',
   'yes_no',
   '{"help_text":"Version-controlled documentation enables you to demonstrate the compliance posture at any historical point in time — important for audits and post-incident reviews. Document the tool used (e.g. Git, Confluence with version history) and the retention period."}'
  ),

  -- ═══════════════════════════════════════════════════════════
  -- Article 12 — Logging and Record Keeping
  -- ═══════════════════════════════════════════════════════════

  ('logging', 1,
   'Does your AI system automatically generate logs of events during operation?',
   'yes_no',
   '{"critical":true,"help_text":"Article 12 requires automatic logging throughout the operational lifetime of the AI system. This is not optional. Server logs and application error logs do not satisfy this requirement — the logs must capture AI-specific events: what input was received, what output was produced, and when."}'
  ),

  ('logging', 2,
   'What types of events are captured in your logs?',
   'text',
   '{"placeholder":"List the specific events logged: e.g. inputs received, outputs generated, decisions made, errors, overrides by humans.","help_text":"At minimum, Article 12 requires logs to capture: the operational period, the reference database against which the system was checked (if applicable), and input data that led to the system''s decisions. Logs must enable post-hoc traceability of individual decisions."}'
  ),

  ('logging', 3,
   'Does each log entry capture both the input data and the corresponding output or decision?',
   'yes_no',
   '{"critical":true,"help_text":"This is the core requirement of Article 12. Each individual AI decision must be traceable: what was the specific input, and what did the system decide? Aggregate logs that do not link inputs to outputs do not satisfy this requirement."}'
  ),

  ('logging', 4,
   'What is your current log retention period, and is it formally documented in a retention policy?',
   'select',
   '{"options":["Less than 6 months","6–12 months","1–3 years","More than 3 years","No defined retention period"],"help_text":"Article 12 requires a minimum retention period of 6 months. For some applications (e.g. employment decisions, credit scoring), longer retention may be required under sector-specific law. Document the retention period and the legal basis for it."}'
  ),

  ('logging', 5,
   'Are logs stored securely with access controls, and are tamper-prevention or integrity measures in place?',
   'yes_no',
   '{"help_text":"Logs must be protected against unauthorised modification or deletion. Acceptable measures include: append-only storage, cryptographic hashing of log entries, immutable audit trails, or write-once storage. Access to logs should be limited to authorised personnel and auditors."}'
  ),

  ('logging', 6,
   'Can your logs be made available to competent authorities on request?',
   'yes_no',
   '{"help_text":"Article 12 requires that logs be accessible to competent authorities for the purposes of monitoring compliance. Describe the process for extracting and providing logs in response to a regulatory request — including who would be responsible and the expected turnaround time."}'
  ),

  ('logging', 7,
   'Is there a defined process for reviewing logs to detect anomalies, errors, or incidents?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your incident detection process, log review procedure, or anomaly detection documentation.","help_text":"Logging alone is not sufficient — you must demonstrate that logs are reviewed. Describe the frequency of log review, whether automated anomaly detection is used, and how detected issues are escalated."}'
  ),

  ('logging', 8,
   'If your AI system is used by multiple deployers or clients, how is logging managed across those deployments?',
   'text',
   '{"placeholder":"Describe whether logs are centralised or decentralised, and how each deployer accesses their logs.","help_text":"Article 12 applies to each deployment of the AI system. If you provide the system to other organisations (deployers), clarify in your contracts who is responsible for logging and who holds the logs. You cannot delegate away your Article 12 obligations entirely."}'
  ),

  ('logging', 9,
   'Describe a specific recent example of how a log was used to investigate an issue or verify a decision.',
   'text',
   '{"placeholder":"Describe the incident, how logs were used, and what was found.","help_text":"A practical example demonstrates that your logging system is operational and fit for purpose — not just configured but never used. This is compelling evidence during an audit."}'
  ),

  ('logging', 10,
   'Are there separate logs for system-level events (errors, restarts) and decision-level events (AI inputs and outputs)?',
   'yes_no',
   '{"help_text":"System logs (errors, performance metrics) and decision logs (per-inference inputs and outputs) serve different purposes. AI Act compliance specifically requires decision-level logs. Separating them makes it easier to produce the right logs in response to regulatory requests."}'
  ),

  -- ═══════════════════════════════════════════════════════════
  -- Article 13 — Transparency
  -- ═══════════════════════════════════════════════════════════

  ('transparency', 1,
   'Are end users clearly informed when they are interacting with, or subject to a decision by, an AI system?',
   'yes_no',
   '{"critical":true,"help_text":"Article 13 requires that operators and deployers are informed that the system is AI-powered. For systems that make decisions about individuals, those individuals must also be informed. Marketing language that mentions AI does not satisfy this requirement — formal disclosure in documentation and user-facing communications is required."}'
  ),

  ('transparency', 2,
   'Do you provide clear instructions for use to the organisations or individuals deploying your AI system?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your instructions for use, user manual, or deployer documentation.","help_text":"Article 13 requires instructions for use that include: the intended purpose, the level of accuracy and performance, conditions under which it may produce inaccurate results, and any foreseeable unintended outcomes. The instructions must be written in a language and format accessible to non-technical deployers."}'
  ),

  ('transparency', 3,
   'Is information about the AI system''s capabilities AND limitations clearly communicated to deployers and users?',
   'yes_no',
   '{"help_text":"Many companies communicate capabilities only. Article 13 explicitly requires that limitations are also documented and communicated — including: the types of input for which the system may underperform, demographic groups for which accuracy is lower, and conditions under which the system should not be used."}'
  ),

  ('transparency', 4,
   'Is your transparency documentation available in the language(s) of the EU member states where the system is deployed?',
   'yes_no',
   '{"help_text":"Article 13 requires instructions for use to be in a language that can be easily understood by deployers — which typically means the language of the country where they operate. If you operate across multiple EU member states, consider whether English-only documentation is sufficient."}'
  ),

  ('transparency', 5,
   'How do you communicate significant limitations that could affect the safety or reliability of AI system outputs?',
   'text',
   '{"placeholder":"Describe how limitations are documented and communicated to deployers, users, and affected individuals.","help_text":"Significant limitations include: accuracy degradation on specific input types, known performance gaps across demographic groups, data recency limitations (''knowledge cutoff''), and situations where the system''s output should not be the sole basis for a decision."}'
  ),

  ('transparency', 6,
   'Is there a formal mechanism for users or affected individuals to flag concerns, unexpected outputs, or potential errors?',
   'yes_no',
   '{"help_text":"A feedback and complaints mechanism is not explicitly required by Article 13, but is required under Article 14 (human oversight) and implied by the broader transparency obligations. It also protects you by surfacing issues before they become regulatory incidents."}'
  ),

  ('transparency', 7,
   'Are transparency obligations (disclosure, instructions for use, limitations) formally included in your contracts with deployers?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload a redacted excerpt of your deployer contract covering transparency and disclosure obligations.","help_text":"Your contractual arrangements with deployers should clearly assign transparency obligations: who must inform end users, who maintains the instructions for use, and who is responsible for communicating updates. This protects you from liability if a deployer fails to disclose."}'
  ),

  ('transparency', 8,
   'Are accuracy and performance metrics for the AI system published or made available to deployers and users?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your published performance benchmarks, accuracy metrics, or validation results summary.","help_text":"Article 13 requires that the accuracy, robustness, and cybersecurity levels be communicated. Marketing claims like ''99% accuracy'' without specifying the test conditions, dataset, and what ''accuracy'' means do not satisfy this requirement."}'
  ),

  ('transparency', 9,
   'Describe the information provided to a person before they are first subject to a decision by your AI system.',
   'text',
   '{"placeholder":"e.g. a candidate applying for a job screened by your AI system — what are they told, when, and how?","help_text":"Walk through a concrete example from the perspective of an affected individual. What do they know? Are they informed the decision is AI-assisted? Can they request an explanation? This practical test often reveals transparency gaps that policies alone do not show."}'
  ),

  ('transparency', 10,
   'Is there a process for providing explanations of AI-assisted decisions to affected individuals who request them?',
   'yes_no',
   '{"help_text":"Article 86 of GDPR provides a right to explanation for automated decisions with significant effects. While this is GDPR, not the AI Act directly, the AI Act''s transparency obligations effectively reinforce this. Describe your process for handling explanation requests — who handles them, what information is provided, and within what timeframe."}'
  ),

  -- ═══════════════════════════════════════════════════════════
  -- Article 14 — Human Oversight
  -- ═══════════════════════════════════════════════════════════

  ('human_oversight', 1,
   'Is there a technical mechanism for a human to intervene, override, or completely halt the AI system?',
   'yes_no',
   '{"critical":true,"help_text":"Article 14 requires that the AI system be designed to allow human oversight, including the ability to halt the system. This must be a technical capability — not just a policy that humans can override. Describe the actual mechanism: is there a kill switch, an override button, a human approval step?"}'
  ),

  ('human_oversight', 2,
   'Are the individuals responsible for overseeing the AI system formally trained to understand its capabilities and limitations?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload training materials, competency records, or training completion certificates.","help_text":"Article 14 requires that human overseers have the competency to understand the system''s capabilities and limitations, detect signs of anomalous operation, and interpret outputs in context. Generic AI training does not satisfy this — training must be specific to this AI system."}'
  ),

  ('human_oversight', 3,
   'Can human overseers detect signs of anomalous operation and act on them?',
   'yes_no',
   '{"help_text":"Article 14 requires that overseers be able to interpret outputs correctly — including identifying when an output is likely wrong, biased, or the result of an anomaly. Describe what ''anomalous output'' looks like for your system and how overseers are trained to recognise it."}'
  ),

  ('human_oversight', 4,
   'Can the human overseeing the system choose not to use its output in any given case?',
   'yes_no',
   '{"critical":true,"help_text":"This is the core of Article 14. A human who reviews AI outputs but always acts on them is not exercising meaningful oversight. The system must be designed so that the human can — and occasionally does — reject the AI''s recommendation. Describe a real example of an output being rejected and what happened instead."}'
  ),

  ('human_oversight', 5,
   'Describe the human oversight procedures in place during normal operation.',
   'text',
   '{"placeholder":"Walk through what happens step-by-step when the AI system produces an output that affects an individual.","help_text":"Be specific. Who receives the AI output? What information do they see (just the decision, or the reasoning too)? What actions can they take? How long do they have? What happens if they disagree? This practical description is the most useful evidence for compliance."}'
  ),

  ('human_oversight', 6,
   'What happens when the AI system encounters an out-of-scope input, edge case, or uncertain situation?',
   'text',
   '{"placeholder":"Describe the technical and procedural response when the system encounters inputs it was not designed for.","help_text":"Article 14 requires the system to be interpretable and to flag uncertainty. Describe: does the system flag low-confidence outputs? Does it route uncertain cases to a senior reviewer? What is the fallback if the system cannot produce a reliable output?"}'
  ),

  ('human_oversight', 7,
   'Is there a defined escalation process for AI-assisted decisions that may significantly affect an individual?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your escalation process documentation or decision review procedure.","help_text":"High-stakes decisions (e.g. rejecting a job application, declining a loan, flagging someone for investigation) should have a defined escalation path to a senior human reviewer. Describe the criteria for escalation and the review process."}'
  ),

  ('human_oversight', 8,
   'Are there explicit circumstances defined in which the AI system must defer entirely to a human decision-maker?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload documentation defining the mandatory human-review scenarios for your AI system.","help_text":"Article 14 implies that there should be defined situations where human judgement takes precedence regardless of the AI''s output — for example, cases involving disabled individuals, border-line decisions, or decisions that could have particularly severe consequences."}'
  ),

  ('human_oversight', 9,
   'How is accountability assigned for AI-assisted decisions that materially affect individuals?',
   'text',
   '{"placeholder":"Who is accountable when an AI-assisted decision turns out to be wrong — legally, operationally, and reputationally?","help_text":"Article 14 implies clear accountability. If your AI system assists in a hiring decision and the candidate later claims discrimination, who is responsible? Document the accountability chain: from the AI provider to the deployer to the individual decision-maker."}'
  ),

  ('human_oversight', 10,
   'Is the effectiveness of your human oversight mechanism regularly tested and validated?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload records of oversight effectiveness testing, internal audit reports, or override rate statistics.","help_text":"A human oversight mechanism that is never tested may not work when needed. Useful evidence includes: override rate statistics (what % of AI decisions are modified by humans), results of internal audits of the review process, and records of cases where human reviewers caught AI errors."}'
  ),

  -- ═══════════════════════════════════════════════════════════
  -- Article 15 — Accuracy and Robustness
  -- ═══════════════════════════════════════════════════════════

  ('accuracy', 1,
   'Has your AI system been tested for accuracy against defined, pre-specified performance benchmarks?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your performance benchmarking report, test results, or accuracy evaluation methodology.","help_text":"Article 15 requires defined accuracy metrics declared in technical documentation. The metrics must be pre-specified before testing (not selected after the fact to look favourable). Describe: what metric was used, what was the target, and what was the actual result."}'
  ),

  ('accuracy', 2,
   'What is the measured accuracy or performance of your system on its primary task, and how was it measured?',
   'text',
   '{"placeholder":"e.g. ''Precision: 91%, Recall: 87%, on a held-out test set of 10,000 records representing the deployment population.''","help_text":"Be specific about: (1) the metric(s) used and why they are appropriate for this task, (2) the dataset used for evaluation, (3) whether the test set was representative of the actual deployment population, and (4) how performance is reported for different subgroups."}'
  ),

  ('accuracy', 3,
   'Has the system been tested for robustness against adversarial inputs, edge cases, and distributional shift?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload adversarial testing results, edge case analysis, or robustness evaluation documentation.","help_text":"Article 15 requires resilience against adversarial manipulation and errors. This includes: testing with inputs designed to fool the system, testing with unusual or extreme inputs, and testing with data that differs from the training distribution. Describe what adversarial testing was conducted and the results."}'
  ),

  ('accuracy', 4,
   'Is system performance monitored on an ongoing basis after deployment?',
   'yes_no',
   '{"help_text":"Pre-deployment testing is not sufficient. Article 15 implies ongoing monitoring to detect performance degradation. Describe what metrics are monitored, how frequently, who is responsible, and what triggers an investigation or intervention."}'
  ),

  ('accuracy', 5,
   'Do you have a defined process for responding to detected errors, failures, or significant performance degradation?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your incident response process, performance degradation playbook, or model governance policy.","help_text":"A monitoring system without a response plan provides limited protection. Describe: what constitutes a performance incident, who is notified, what the escalation path is, and what the criteria for pausing or rolling back the system are."}'
  ),

  ('accuracy', 6,
   'Has the system been evaluated for fairness and consistency of performance across different demographic groups?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload fairness evaluation reports, disaggregated performance results, or demographic parity analysis.","help_text":"Article 15 requires accuracy to be maintained across relevant subgroups. Relevant protected characteristics: gender, age, racial or ethnic origin, disability. The system should not perform materially better for some groups than others — particularly when decisions affect employment, credit, healthcare, or similar high-stakes outcomes."}'
  ),

  ('accuracy', 7,
   'What technical measures are in place to protect the AI system against cybersecurity threats and adversarial attacks?',
   'text',
   '{"placeholder":"Describe security measures applied to the training pipeline, model storage, inference environment, and API endpoints.","help_text":"Article 15 covers resilience against adversarial attacks (inputs designed to manipulate outputs), data poisoning (contaminating training data), and model extraction (attempts to reconstruct your model). Describe your threat model and the controls applied to each risk."}'
  ),

  ('accuracy', 8,
   'Is there a fallback mechanism that activates if the AI system fails or produces outputs below a reliability threshold?',
   'yes_no',
   '{"help_text":"Article 15 requires fallback plans for when the system cannot produce reliable outputs. Examples: reverting to a human decision-maker, using a simpler rule-based system, or declining to produce an output at all. Describe the fallback and the threshold that triggers it."}'
  ),

  ('accuracy', 9,
   'How do you detect and address performance degradation over time (model drift)?',
   'text',
   '{"placeholder":"Describe your approach to detecting concept drift, data drift, and model staleness, and your retraining process.","help_text":"Models trained on historical data may degrade when real-world patterns change. Describe: (1) what signals you monitor for drift, (2) how frequently models are retrained or evaluated, (3) the validation process before a retrained model replaces the production model."}'
  ),

  ('accuracy', 10,
   'If continuous learning or post-deployment retraining is used, how is it governed and validated before changes take effect?',
   'text',
   '{"placeholder":"Describe your continuous learning governance: who approves updates, what validation is required, and how rollbacks work.","help_text":"Continuous learning models can drift rapidly and in unexpected directions. If your system learns from production data, describe the governance controls: approval gates, validation requirements, monitoring of model behaviour post-update, and rollback capability."}'
  ),

  -- ═══════════════════════════════════════════════════════════
  -- Articles 43 & Annex VI/VII — Conformity Assessment
  -- ═══════════════════════════════════════════════════════════

  ('conformity', 1,
   'Have you determined which conformity assessment procedure applies to your AI system under Article 43?',
   'yes_no',
   '{"critical":true,"help_text":"Article 43 provides two routes: internal conformity assessment (Annex VI) or third-party assessment by a notified body (Annex VII). Third-party assessment is required for: biometric identification systems, real-time remote biometric identification systems, and AI in critical infrastructure. All other high-risk AI systems may use the internal route — but only if their technical documentation satisfies all Annex IV requirements."}'
  ),

  ('conformity', 2,
   'Is an internal conformity assessment sufficient for your system, or is a notified body required?',
   'select',
   '{"options":["Internal assessment is sufficient (Annex VI route)","A notified body is required (Annex VII route)","We are not yet certain — still under determination","Not applicable — our system is not high-risk"],"help_text":"A notified body is required for: biometric identification systems (other than those used by law enforcement), real-time remote biometric identification, and AI systems that are safety components of products already subject to third-party conformity assessment (e.g. medical devices, machinery). If uncertain, seek legal advice."}'
  ),

  ('conformity', 3,
   'Have you compiled all technical documentation required for conformity assessment (as specified in Annex IV)?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your Annex IV technical documentation package or a contents checklist.","help_text":"Annex IV requires documentation covering 9 specific areas. Before conducting a conformity assessment, all 9 must be complete. A useful approach: create a compliance matrix mapping each Annex IV requirement to the relevant section of your documentation."}'
  ),

  ('conformity', 4,
   'Have you drawn up or are you in the process of preparing an EU Declaration of Conformity (Article 47)?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your EU Declaration of Conformity or a draft of it.","help_text":"Article 47 requires a written EU Declaration of Conformity before placing a high-risk AI system on the market. The declaration must: identify the AI system, reference the applicable regulations and standards, state that the system conforms to those regulations, and be signed by an authorised representative. It must be kept for 10 years."}'
  ),

  ('conformity', 5,
   'Does your high-risk AI system have a CE marking, or is one planned and on a defined timeline?',
   'yes_no',
   '{"help_text":"Article 48 requires a CE marking before a high-risk AI system is placed on the EU market. The CE marking cannot be applied until the conformity assessment is completed and the EU Declaration of Conformity is drawn up. The marking must be affixed visibly, legibly, and indelibly."}'
  ),

  ('conformity', 6,
   'Has your high-risk AI system been registered in the EU AI Act database (Article 49), or is registration planned?',
   'yes_no',
   '{"help_text":"Article 49 requires providers of high-risk AI systems to register in the EU database maintained by the Commission before placing their system on the market. The database registration includes: system name, intended purpose, risk classification, conformity assessment outcome, and contact information. Registration is separate from CE marking."}'
  ),

  ('conformity', 7,
   'Is there a quality management system (QMS) in place that supports your conformity assessment obligations?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your QMS documentation, ISO 9001 certificate, or quality management framework.","help_text":"Article 17 requires providers to implement a quality management system covering: compliance strategy, risk management, technical documentation management, data governance, training, corrective actions, and post-market monitoring. A QMS does not need to be ISO-certified, but ISO 9001 or ISO 42001 certification provides strong evidence of compliance."}'
  ),

  ('conformity', 8,
   'Describe any third-party assessments, audits, or certifications that have been conducted on your AI system.',
   'text',
   '{"placeholder":"Include: the name of the assessing body, the scope of the assessment, the date, and the outcome.","allow_file":true,"file_hint":"Upload audit reports, certification documents, or third-party assessment results.","help_text":"Third-party assessments — even if not legally required for your risk category — significantly strengthen your compliance posture and provide independent evidence for regulators. Relevant certifications include: ISO 42001 (AI management systems), SOC 2 (for security and availability), and sector-specific certifications."}'
  ),

  ('conformity', 9,
   'Do you have a post-market monitoring plan that will enable you to track compliance after the system is deployed?',
   'yes_no',
   '{"allow_file":true,"file_hint":"Upload your post-market monitoring plan or system.","help_text":"Article 72 requires providers to actively monitor their high-risk AI systems after deployment. The monitoring system must: collect and analyse data on system performance, detect issues and near-misses, feed findings back into the risk management system, and report serious incidents to national authorities under Article 73."}'
  ),

  ('conformity', 10,
   'What is your planned timeline for completing conformity assessment, CE marking, and database registration?',
   'text',
   '{"placeholder":"List key milestones with target dates, e.g.: ''Annex IV documentation complete: March 2026. Conformity assessment: May 2026. CE marking: June 2026.''","help_text":"The EU AI Act deadline for high-risk AI systems is August 2, 2026. Work backwards from that date. Conformity assessment, particularly if a notified body is involved, can take several months. Early engagement with a notified body is strongly advised."}'
  )

)
INSERT INTO diagnostic_questions (obligation_id, question_code, order_index, sort_order, question_text, question_type, metadata)
SELECT
  o.id,
  CASE q.obligation_key
    WHEN 'risk_mgmt'       THEN 'RM'
    WHEN 'data_gov'        THEN 'DG'
    WHEN 'tech_doc'        THEN 'TD'
    WHEN 'logging'         THEN 'LG'
    WHEN 'transparency'    THEN 'TR'
    WHEN 'human_oversight' THEN 'HO'
    WHEN 'accuracy'        THEN 'AR'
    WHEN 'conformity'      THEN 'CA'
  END || '-' || LPAD(q.order_index::text, 2, '0'),
  q.order_index,
  q.order_index,
  q.question_text,
  q.question_type,
  q.metadata::jsonb
FROM questions q
JOIN obligation_ids o ON o.key = q.obligation_key
WHERE o.key IS NOT NULL;

-- ── Verify ─────────────────────────────────────────────────────
SELECT
  ob.title AS obligation,
  COUNT(dq.id) AS question_count
FROM obligations ob
LEFT JOIN diagnostic_questions dq ON dq.obligation_id = ob.id
GROUP BY ob.title
ORDER BY ob.title;
