-- ============================================================
-- LexSutra Questionnaire v2 — Rich Metadata Seed
-- Updates all 80 questions with help_text, placeholder,
-- critical flags, and allow_file flags.
-- Uses individual UPDATE statements — safe to re-run.
-- ============================================================

-- Ensure metadata column exists before updating
ALTER TABLE diagnostic_questions
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- ── Art. 9 — Risk Management System ──────────────────────────────────
UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 9 requires high-risk AI providers to establish, implement, document, and maintain a risk management system throughout the AI system lifecycle. This should be a systematic, documented process — not just informal awareness. Auditors will look for a written policy, named responsible owners, and evidence the process runs regularly.",
    "placeholder": "e.g. We maintain a formal AI Risk Register reviewed quarterly by our CTO. Risks are classified by severity and likelihood using a 5x5 matrix...",
    "critical": true,
    "allow_file": true,
    "file_hint": "Risk Register, AI Risk Management Policy (PDF/DOCX)"
  }
$$::jsonb
WHERE question_text = 'Does your organisation have a documented AI risk management system?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Risk Management%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "The EU AI Act requires the risk management process to be iterative across the system lifecycle. Ad-hoc means you only review when something goes wrong — this is insufficient for a high-risk system. Continuous or annual reviews with documented outcomes are preferred.",
    "placeholder": "e.g. We review our risk register at least annually, and additionally after any major model update or incident...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'How frequently is your risk management process reviewed and updated?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Risk Management%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Risk identification should cover technical risks (model errors, bias, drift), operational risks (misuse, over-reliance), and legal risks (GDPR interaction, liability). Describe your methodology — is it qualitative, quantitative, or both? Who participates?",
    "placeholder": "e.g. We use a structured threat modelling approach. Risks are identified in workshops with engineering, legal, and operations teams. Each risk is scored on a 5x5 likelihood/impact matrix...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Describe how risks specific to your AI system are identified and assessed.'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Risk Management%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 9(2)(a) specifically requires providers to identify and analyse the intended purpose AND foreseeable misuse. Foreseeable misuse means any predictable off-label or unintended use — even by well-meaning users. If you have not documented misuse scenarios, this is a critical gap.",
    "placeholder": "e.g. Intended purpose: automated candidate screening. Misuse scenarios documented: using the score as the sole hiring decision without human review, applying to roles outside the trained domain...",
    "critical": true,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Have you identified the intended purpose and foreseeable misuse cases of your AI system?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Risk Management%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 9(7) requires that the risk management process have named owners with appropriate authority. A vague answer such as 'the tech team' is not sufficient — auditors will want a specific role or individual accountable for the overall risk management function.",
    "placeholder": "e.g. The CTO holds overall accountability. Day-to-day risk tracking is managed by our AI Safety Lead. Risk review meetings are chaired by the COO...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Who within your organisation is responsible for AI risk management?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Risk Management%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Each deployment or significant update may change the risk profile. A formal assessment before go-live is best practice and will be expected during conformity assessment. If you only assess once at initial launch, this is a partial compliance gap.",
    "placeholder": "e.g. Yes — our deployment checklist includes a mandatory risk assessment sign-off. No release proceeds without CTO approval of the updated risk register...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Do you conduct formal risk assessments before each deployment or significant update?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Risk Management%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Identifying risks is not enough — Article 9(4) requires that risk mitigation measures are put in place and tested. A risk register that lists risks but has no corresponding mitigations, or where mitigations have never been tested, will be flagged as a critical gap.",
    "placeholder": "e.g. Yes — each risk entry in our register links to a mitigation action with a named owner and target completion date. Mitigation effectiveness is tested quarterly...",
    "critical": false,
    "allow_file": true,
    "file_hint": "Risk Mitigation Log, Remediation Tracker (PDF/XLSX)"
  }
$$::jsonb
WHERE question_text = 'Are risk mitigation measures documented, tested, and tracked?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Risk Management%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Even after mitigation, some residual risk will remain. Article 9(6) requires that residual risks are assessed and communicated to deployers so they can make informed deployment decisions. If you cannot identify any residual risks, that itself may be a red flag for reviewers.",
    "placeholder": "e.g. Residual risk: occasional false positives on non-standard CV formats (~3%). Communicated via our deployer instructions document and our API documentation...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Describe any residual risks identified and how they are communicated to deployers.'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Risk Management%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "For high-risk AI systems, the AI risk management process should not operate in isolation. It should feed into and draw from your ISO 27001, GDPR DPIA processes, and any broader ERM framework. Integration means shared governance, not just awareness.",
    "placeholder": "e.g. Our AI risk register is reviewed alongside our ISO 27001 risk assessment annually. GDPR DPIAs are triggered automatically for any AI processing personal data...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is your AI risk management system integrated with your broader organisational risk framework?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Risk Management%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "End-user interaction can generate new and unexpected risks — for example, users gaming the system, over-relying on outputs, or inputting unexpected data. Article 9(2)(b) specifically covers this. If you have not studied or modelled user interaction risks, this is a notable gap.",
    "placeholder": "e.g. Yes — we conducted user research during beta testing. We identified the risk of over-reliance and added mandatory human-in-the-loop messaging to all output screens...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Have you assessed risks arising from the interaction between your AI system and its end users?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Risk Management%');

-- ── Art. 10 — Data Governance ──────────────────────────────────
UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 10 requires providers to have governance practices for training, validation, and test datasets. You need to clearly identify what data you use at each stage. Auditors will look for whether you use third-party datasets, synthetic data, or proprietary data — and whether you have documented their provenance.",
    "placeholder": "e.g. Training: proprietary CV/job posting dataset (2019–2023, 2.1M records). Validation: held-out 15% split of training data. Testing: independently collected 10,000 record test set from partner HR firms...",
    "critical": true,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'What types of data does your AI system use for training, validation, and testing?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Data Governance%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 10(2)(b) requires documentation of the training dataset's characteristics including provenance, scope, data collection methods, and known limitations. Without this documentation, you cannot demonstrate compliance during a conformity assessment.",
    "placeholder": "e.g. Yes — we maintain a Dataset Card for each training dataset, including provenance, collection date range, demographic breakdown, and known limitations...",
    "critical": false,
    "allow_file": true,
    "file_hint": "Dataset Card, Data Dictionary, Dataset Documentation (PDF/DOCX)"
  }
$$::jsonb
WHERE question_text = 'Do you maintain documentation of your training datasets including provenance and characteristics?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Data Governance%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 10(3) requires that datasets be relevant to the intended purpose, representative of the operating environment, and free from significant errors. Describe your quality control methodology — what checks do you run and when?",
    "placeholder": "e.g. We run automated schema validation, null-rate checks, and distribution analysis on all datasets before training. Human review is conducted for any dataset flagged by automated QC...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'How do you ensure training data is relevant, representative, and free from significant errors?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Data Governance%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 10(2)(f) requires that datasets are examined for possible biases, especially those that may lead to discriminatory outputs. A formal bias assessment means a documented process, not just intuition. This is one of the most scrutinised areas in HR tech AI systems.",
    "placeholder": "e.g. Yes — we ran a bias audit using the Fairlearn library prior to launch. Results showed gender parity within 3% across all role categories. Audit report available on request...",
    "critical": false,
    "allow_file": true,
    "file_hint": "Bias Audit Report, Fairness Assessment (PDF/DOCX)"
  }
$$::jsonb
WHERE question_text = 'Have you conducted a formal assessment of your training data for potential biases?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Data Governance%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "A data governance policy sets out the rules for how data is collected, stored, retained, and who can access it. Without a written policy, you are relying on informal practices — which will be considered a gap under Article 10. This is critical for high-risk systems processing personal data.",
    "placeholder": "e.g. Yes — we have a formal Data Governance Policy (v2.1, reviewed March 2025) covering collection consent, storage locations (EU-only), retention schedules, and access control matrix...",
    "critical": true,
    "allow_file": true,
    "file_hint": "Data Governance Policy, Data Management Framework (PDF/DOCX)"
  }
$$::jsonb
WHERE question_text = 'Do you have data governance policies covering collection, storage, retention, and access control?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Data Governance%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "If PII is used in training (even anonymised or pseudonymised data), additional GDPR obligations apply alongside the EU AI Act. You must have a lawful basis for processing, and ideally a completed DPIA. This is a critical question — if PII is in training data and no DPIA exists, you have a significant compliance gap.",
    "placeholder": "e.g. Yes — our training data includes pseudonymised CVs. We processed them under legitimate interest. A DPIA was completed in January 2024 and approved by our DPO...",
    "critical": true,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is personally identifiable information (PII) used during training or inference?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Data Governance%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Data quality can degrade over time as the real-world environment changes (data drift). Article 10(4) covers ongoing data management practices. Describe what monitoring you have in place post-deployment — automated pipelines, periodic audits, or manual spot checks.",
    "placeholder": "e.g. We run weekly automated data quality checks on incoming data using Great Expectations. Any schema violation or distribution shift >2 standard deviations triggers an alert to the ML team...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'How is data quality monitored on an ongoing basis after the model is deployed?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Data Governance%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "The right to rectification under GDPR, combined with EU AI Act data governance requirements, means you must have a process for correcting or removing data. If you cannot easily remove a specific individual's data from your training set upon a subject access request, this is a significant gap.",
    "placeholder": "e.g. Yes — our data pipeline supports targeted record deletion. Upon receiving a GDPR erasure request, we remove the record from our database and retrain the affected model component within 30 days...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Do you have a process for correcting or removing inaccurate, outdated, or biased data?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Data Governance%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "For GDPR compliance and data sovereignty reasons, the physical location of your data storage matters. EU AI Act Annex IV requires this to be documented. If you use US-based cloud providers without EU data residency guarantees, this is a potential gap.",
    "placeholder": "e.g. All training and operational data is stored in AWS eu-west-1 (Dublin, Ireland). We use AWS S3 with encryption at rest. No data leaves the EU region. Governed under Dutch law...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Where is your training and operational data stored, and under what legal jurisdiction?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Data Governance%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Regular bias audits — not just a one-time assessment — are expected for systems operating in high-risk domains. This means scheduled, documented audits (e.g., quarterly or annually) with results reviewed by appropriate oversight. Ongoing audits demonstrate a mature data governance posture.",
    "placeholder": "e.g. We conduct quarterly automated fairness checks using Aequitas. Full annual bias audits are conducted by an independent third party. Last audit: December 2024 — no critical issues found...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Do you conduct regular bias audits across protected demographic characteristics?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Data Governance%');

-- ── Art. 11 & Annex IV — Technical Documentation ──────────────────────────────────
UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 11 and Annex IV require providers of high-risk AI systems to prepare and maintain comprehensive technical documentation BEFORE placing the system on the market. This is not optional — it is a legal pre-condition for CE marking and market access. Without it, no conformity assessment can proceed.",
    "placeholder": "e.g. Yes — we maintain a Technical Documentation Pack (TDP) aligned with EU AI Act Annex IV. Currently at version 3.2, last updated February 2025. Kept under version control in our internal document management system...",
    "critical": true,
    "allow_file": true,
    "file_hint": "Technical Documentation Pack, System Design Document (PDF/DOCX)"
  }
$$::jsonb
WHERE question_text = 'Do you maintain technical documentation describing the AI system design and development process?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Technical Documentation%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Annex IV Section 1 specifically requires documentation of the general description including intended purpose, the persons the system is intended to be used by, and the specific contexts of use. Without this, your documentation is incomplete for conformity assessment purposes.",
    "placeholder": "e.g. Yes — Section 1 of our TDP covers intended purpose (automated CV screening for tech roles), authorised users (HR teams), deployment context (B2B SaaS), and exclusions (not for use in medical or financial sectors)...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Does your documentation include the intended purpose, scope, and conditions of use?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Technical Documentation%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Annex IV Section 2(a) requires documentation of the overall design including a general description of the architecture, choices of design methodology, and interaction between AI components. This should include architecture diagrams showing data flows between components.",
    "placeholder": "e.g. Yes — Section 2 of our TDP includes architecture diagrams, a description of our transformer-based CV encoder, the scoring layer design rationale, and data flow diagrams approved by our Principal Architect...",
    "critical": false,
    "allow_file": true,
    "file_hint": "System Architecture Document, Architecture Diagrams (PDF)"
  }
$$::jsonb
WHERE question_text = 'Is your system architecture — including model type, training procedure, and component interaction — documented?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Technical Documentation%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Annex IV Section 2(d) requires documentation of training data characteristics including data collection methodology, provenance, pre-processing steps, and data splits. This is distinct from dataset governance — it is specifically about documenting what you did to the data before training.",
    "placeholder": "e.g. Yes — our TDP Section 3 documents training data sources, pre-processing steps (tokenisation, normalisation, PII masking), train/validation/test splits (70/15/15), and data versioning through DVC...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Do you document training data characteristics, pre-processing methodologies, and data splits?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Technical Documentation%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Annex IV Section 2(f) requires documentation of validation and testing methodology including test datasets, metrics chosen, and results. You need to show that you tested the system systematically, not just informally. An independent test set (not used in training or validation) is expected.",
    "placeholder": "e.g. Yes — we document our testing methodology in TDP Section 4. Primary metrics: Precision@K, AUC-ROC, and demographic parity. Test dataset: 10,000 held-out CVs from partner firms, never used in training...",
    "critical": false,
    "allow_file": true,
    "file_hint": "Test Report, Model Evaluation Report, Validation Results (PDF)"
  }
$$::jsonb
WHERE question_text = 'Is your validation and testing methodology, including test datasets and metrics, documented?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Technical Documentation%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 11(3) requires technical documentation to be kept up to date. If you update your model, change data sources, or make significant architectural changes, your documentation must reflect those changes. Stale documentation that does not match the live system is a compliance failure.",
    "placeholder": "e.g. We follow a change management process — any model update triggers a mandatory documentation review within 14 days. The TDP is version-controlled in Confluence with a mandatory sign-off from the technical lead...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'How is technical documentation kept up to date when the AI system is changed or updated?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Technical Documentation%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 11(2) requires that technical documentation be provided to competent national authorities on request. This means it must be stored securely but be retrievable quickly. If your documentation is scattered across multiple systems with no single owner, this is a practical compliance gap.",
    "placeholder": "e.g. Yes — our TDP is stored in a secure document management system with role-based access. The document owner (CTO) can produce a complete PDF export within 24 hours of a formal request...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is your technical documentation accessible to competent authorities upon formal request?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Technical Documentation%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Version control for technical documentation ensures you can demonstrate what the system looked like at any point in time — which is essential for post-incident investigations and regulatory inspections. If your documentation is unversioned, you cannot demonstrate historical compliance.",
    "placeholder": "e.g. Yes — all documentation is stored in Confluence with full version history. Code artefacts are in Git. We maintain numbered document versions aligned to product releases...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Do you use version control for your technical documentation?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Technical Documentation%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "This is an open-ended question to capture the architectural overview. Describe your system at a high level — what type of model, how it processes inputs, what outputs it produces, and what external dependencies it has. This feeds directly into the Annex IV Section 2(a) requirement.",
    "placeholder": "e.g. Our system is a BERT-based candidate ranking model. It processes CV text and job description text, generates embeddings, computes a compatibility score, and returns a ranked list of candidates. It integrates with ATS platforms via REST API...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Describe the overall AI system design, its main components, and how they interact.'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Technical Documentation%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Annex IV Section 2(g) specifically requires documentation of known limitations and performance boundaries. This includes accuracy degradation outside the training distribution, edge cases where the system may fail, and foreseeable risks. Not documenting limitations is itself a compliance gap.",
    "placeholder": "e.g. Yes — TDP Section 5 documents known limitations: reduced accuracy for non-English CVs (<82% vs 94% overall), performance degradation on roles requiring >15 years experience, known false positive rate on career changers (8%)...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Are known limitations, performance boundaries, and foreseeable risks explicitly documented?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Technical Documentation%');

-- ── Art. 12 — Logging and Record Keeping ──────────────────────────────────
UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 12(1) requires high-risk AI systems to have automatic logging capabilities built into the system itself — not just application-level logs written by the deployer. The system must be capable of generating event logs during operation. If your system produces no logs at all, this is a critical gap.",
    "placeholder": "e.g. Yes — our system generates structured JSON logs on every inference call, including timestamp, input hash, model version, output score, and confidence interval. Logs are written to our centralised logging platform...",
    "critical": true,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Does your AI system automatically generate logs of events during operation?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Logging%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 12(2) specifies that logs must enable monitoring of operation and post-hoc traceability. This means you need to capture enough information to reconstruct what happened and why after the fact. Merely logging errors is insufficient — you need to log inference events, inputs, and outputs.",
    "placeholder": "e.g. We log: inference timestamp, input data hash, model version ID, all output scores and rankings, confidence values, human override events, system errors, and latency metrics...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'What types of events are captured in your logs (e.g., inputs, outputs, decisions, errors)?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Logging%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "The EU AI Act does not specify a precise retention period for AI logs, but Recital 80 implies logs should be retained long enough to enable investigation of incidents. For high-risk HR decisions, employment law in many EU countries requires records to be kept for 1–5 years. Under 12 months is likely insufficient.",
    "placeholder": "",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'What is your current log retention period?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Logging%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 12(1)(b) implies logs must be protected from tampering. If anyone with access to the system can delete or modify logs, they are not reliable for audit purposes. Secure logging means access controls, encryption, and ideally write-once storage or cryptographic integrity checks.",
    "placeholder": "e.g. Yes — logs are written to append-only storage in AWS CloudWatch with IAM policies preventing deletion. Only our CISO can access raw log exports. Log integrity is verified monthly...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Are logs stored securely with access controls and tamper-prevention measures?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Logging%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Post-hoc traceability means you can look at a specific past decision and reconstruct: what data was provided, what the model output was, and what the human did with it. This is essential for investigating discrimination complaints or regulatory enquiries. Without this capability, you cannot defend AI-assisted decisions.",
    "placeholder": "e.g. Yes — each decision event has a unique trace ID. Using the trace ID, we can retrieve the full input, model version, scoring breakdown, and any human override within our log management system...",
    "critical": true,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Can your logs enable post-hoc traceability of individual AI system decisions?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Logging%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 12(2)(a) specifically requires that the AI system logging capabilities include, where applicable, recording of the input data. Without capturing what went in alongside what came out, you cannot do meaningful post-hoc investigation. This is especially critical in HR tech where discrimination cases may arise.",
    "placeholder": "e.g. Yes — every inference log entry captures: the input CV hash (not raw PII), the job description identifier, and the full scoring output vector. Raw inputs are stored separately with GDPR access controls...",
    "critical": true,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Do logs capture both the input data and the corresponding output or decision for each inference?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Logging%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Anomaly detection and incident response for AI logs requires a defined process — not just ad-hoc review when something breaks. Define who reviews logs, how often, what triggers an alert, and what the response procedure is. This demonstrates operational maturity to auditors.",
    "placeholder": "e.g. Yes — we run automated anomaly detection on our inference logs using CloudWatch Alarms. Alerts fire if error rate exceeds 1% or if output distribution shifts significantly. On-call engineer responds within 2 hours...",
    "critical": false,
    "allow_file": true,
    "file_hint": "Log Retention Policy, Logging Architecture Document (PDF/DOCX)"
  }
$$::jsonb
WHERE question_text = 'Is there a defined process for reviewing logs to detect anomalies, errors, or incidents?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Logging%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 12 and Article 26 require that logs be made available to market surveillance authorities on request. If your logs are stored in a proprietary format that requires specialist tooling to read, or if access procedures are unclear, this is a practical compliance gap even if the logs exist.",
    "placeholder": "e.g. Yes — we can export logs in standard JSON or CSV format. Access is provided via our CISO following a verified formal request. We can provide logs covering any period within our retention window...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Can logs be made available to competent authorities on request?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Logging%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "This describes the granularity of your logs at key decision points. For a scoring system, this means: what is captured when a score is computed, when a human reviews it, when a candidate is rejected. Describe what structured data is captured at each of these points.",
    "placeholder": "e.g. At scoring: input hash, job ID, model version, score, confidence. At human review: reviewer ID, review duration, override flag. At rejection: final decision, rejection category, timestamp...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Describe what information is captured at each significant decision point in your system.'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Logging%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Log integrity mechanisms ensure that logs have not been altered after the fact. This is important because tampered logs could be used to cover up discriminatory decisions or system failures. Cryptographic hashing (e.g., SHA-256) or blockchain-anchoring of log batches provides strong integrity guarantees.",
    "placeholder": "e.g. Yes — we compute a SHA-256 hash of each log batch at the end of each day and store it in a separate, read-only verification database. Any tampering of log content will cause hash verification to fail...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Are log integrity mechanisms in place to detect tampering or deletion?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Logging%');

-- ── Art. 13 — Transparency ──────────────────────────────────
UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 13(1) requires that high-risk AI systems be transparent to users. In practice, this means end users must know they are interacting with or being assessed by an AI system. In HR tech, this means candidates must be informed that their CV is being screened by an AI — this is also reinforced by GDPR Article 22.",
    "placeholder": "e.g. Yes — all candidate-facing communications include a disclosure that AI is used in initial CV screening. Our job application portal includes a dedicated AI transparency notice...",
    "critical": true,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Are end users clearly informed when they are interacting with an AI system?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Transparency%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 13(3) requires that providers supply deployers with instructions for use covering the AI system's capabilities, limitations, accuracy metrics, and conditions for safe operation. Without written instructions for use, your deployers cannot fulfil their own Article 26 obligations — making this a critical compliance gap.",
    "placeholder": "e.g. Yes — we provide deployers with a formal Instructions for Use document (v2.0) covering intended purpose, prohibited uses, accuracy benchmarks, and human oversight requirements...",
    "critical": true,
    "allow_file": true,
    "file_hint": "Instructions for Use, Deployer Guide (PDF/DOCX)"
  }
$$::jsonb
WHERE question_text = 'Do you provide clear, accessible instructions for use to operators and deployers?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Transparency%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 13(3)(b) requires communicating the AI system's capabilities and limitations to users. Limitations must be described in practical terms — not buried in technical jargon. Users must understand what the system can and cannot do reliably.",
    "placeholder": "e.g. Yes — our user interface includes a 'How this works' section explaining that the system ranks candidates by job fit (not a final decision), accuracy benchmarks, and known limitations such as reduced accuracy for non-standard CVs...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is information about the AI system''s capabilities and limitations communicated to users?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Transparency%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 13(3) requires that information be provided in a clear, comprehensible format accessible to non-technical deployers. If your only documentation is highly technical API reference material, your deployers may not be able to use it to understand their obligations — which is itself a compliance gap.",
    "placeholder": "e.g. Yes — we maintain both a technical API guide (for engineers) and a plain-language Deployer Guide (for HR managers). The Deployer Guide uses no technical jargon and has been tested with non-technical readers...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is documentation available in a language and format understandable to non-technical deployers?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Transparency%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 13(3)(a) requires that instructions for use describe the intended purpose, applicable use cases, and conditions under which the system is designed to operate. This includes explicitly stating what use cases are NOT intended — preventing off-label deployment.",
    "placeholder": "e.g. Yes — our Instructions for Use clearly state the intended purpose (tech role CV screening, B2B), authorised use cases, and explicitly prohibited uses (sole basis for hiring decision, use outside the EU, use for roles requiring security clearance)...",
    "critical": false,
    "allow_file": true,
    "file_hint": "Terms of Use, Acceptable Use Policy (PDF/DOCX)"
  }
$$::jsonb
WHERE question_text = 'Do you disclose the intended purpose, applicable use cases, and conditions of use?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Transparency%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 13(3)(b) requires communication of significant limitations that could affect safety or fundamental rights. For HR tech, this includes limitations affecting protected characteristics. How do you communicate these — in documentation, in-product UI, or contractually?",
    "placeholder": "e.g. We communicate limitations in our Deployer Guide: reduced accuracy for non-English CVs (disclosed in product UI as a warning), known false positive rate for career changers (included in accuracy metrics table)...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'How do you communicate significant limitations that could affect outputs or safety?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Transparency%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "A feedback mechanism allows users and deployers to report unexpected behaviour, potential errors, or concerns. This is important both for product improvement and for demonstrating to regulators that you take transparency obligations seriously. A basic email contact is the minimum; an in-product reporting tool is better.",
    "placeholder": "e.g. Yes — our deployer portal includes a Report an Issue button. Candidates receive a feedback link with their results. All reports are triaged by our product safety team within 48 hours...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is there a mechanism for users to flag concerns, unexpected behaviour, or potential errors?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Transparency%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "If you sell your AI system to resellers or sub-deployers, your transparency obligations flow down the supply chain. Article 25 requires that importers and distributors ensure providers' obligations are met. You should have contractual terms requiring downstream parties to honour transparency requirements.",
    "placeholder": "e.g. Yes — our standard partner agreement includes obligations for downstream parties to honour our Instructions for Use, AI disclosure requirements, and to pass our transparency documentation to their customers...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Are transparency obligations communicated to parties throughout your supply chain?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Transparency%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Pre-interaction disclosure is about what information you give users BEFORE they engage with the AI system. This is especially important for job seekers — they must be able to make an informed decision. Describe what specific disclosures are made, where, and in what format.",
    "placeholder": "e.g. Before uploading their CV, candidates see a modal disclosure explaining: (1) an AI system is used, (2) it ranks CVs by job fit, (3) a human recruiter makes the final decision, (4) they can request human review. They must tick an acknowledgement checkbox...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Describe what information is provided to users before they first interact with the AI system.'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Transparency%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Public disclosure of performance metrics is not strictly required by the EU AI Act for all providers, but it demonstrates transparency leadership and builds trust. Publishing accuracy and fairness benchmarks proactively can strengthen your commercial position and reduce regulatory scrutiny.",
    "placeholder": "e.g. Yes — our system accuracy benchmarks (precision@10: 87%, demographic parity across gender: 98%) are published on our website product page and in our trust centre...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Do you publicly publish performance metrics or accuracy benchmarks for your AI system?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Transparency%');

-- ── Art. 14 — Human Oversight ──────────────────────────────────
UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 14(4)(a) explicitly requires that high-risk AI systems be designed to allow human operators to intervene, override, or halt the system's operation. This is not optional. If your system has no override mechanism — technical or procedural — this is a critical compliance gap. For HR systems, a human must be able to reverse or disregard an AI recommendation.",
    "placeholder": "e.g. Yes — our UI includes a one-click Override Recommendation button on every AI-scored candidate. Overrides are logged with a mandatory reason. The system can be fully paused via an admin control panel...",
    "critical": true,
    "allow_file": true,
    "file_hint": "Override Procedure Document, Human Oversight Policy (PDF/DOCX)"
  }
$$::jsonb
WHERE question_text = 'Is there a mechanism for a human to intervene, override, or halt the AI system?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Human Oversight%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 14(3) requires that human oversight is implemented by persons with the appropriate competence, training, and authority. Simply designating someone as an overseer without training them on the system's capabilities and limitations is insufficient. Oversight must be meaningful, not nominal.",
    "placeholder": "e.g. Yes — all HR users of the system complete a mandatory 2-hour training module covering system capabilities, known limitations, bias risks, and when to override. Training completion is tracked and mandatory before system access...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Are human overseers formally trained to understand the system''s capabilities and limitations?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Human Oversight%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 14(4)(b) requires that the system be designed with appropriate interfaces enabling operators to understand the system's outputs. Interpretability can be technical (explainability features, SHAP values) or operational (clear labelling of what scores mean, confidence levels). A system that produces a score with no explanation of what drove it makes meaningful oversight very difficult.",
    "placeholder": "e.g. Yes — for each scored candidate, our system shows the top 5 matching factors (skills, experience) and the top 3 gaps. Confidence levels are displayed. No black-box score is presented without supporting explanation...",
    "critical": true,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is the AI system designed to be interpretable or explainable to its operators?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Human Oversight%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 14(4)(d) requires that the system flag situations where confidence is low or where human oversight is particularly warranted. If your system cannot detect its own uncertainty, it cannot facilitate appropriate human intervention. This is especially important in borderline cases.",
    "placeholder": "e.g. Yes — when the system confidence is below 70%, it displays a yellow warning indicator and recommends human review. Candidates flagged as edge cases are placed in a separate Needs Review queue...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Can the system flag situations where it is uncertain or where human oversight is recommended?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Human Oversight%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Describe the operational process for human oversight — not the technical capability, but the actual day-to-day human workflow. Who reviews AI outputs? How often? What criteria do they use to decide whether to accept or override the AI recommendation?",
    "placeholder": "e.g. The HR team reviews all AI shortlists before contacting candidates. Each shortlist is reviewed by two people independently. A consensus is required before proceeding with or overriding the ranking. Review takes an average of 20 minutes per role...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Describe the human oversight procedures in place during normal operation.'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Human Oversight%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 14(4)(c) requires that the system be designed to alert operators if it detects out-of-scope inputs. What happens when a candidate submits a CV in an unexpected format, language, or domain? If the system silently produces a low-quality output without warning, this is a gap.",
    "placeholder": "e.g. If the system receives an unsupported input format (non-text PDF, non-English text), it returns a low confidence flag with an explanation. The candidate is not scored but placed in a manual review queue with a system-generated note...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'What happens when the AI system encounters an out-of-scope input or uncertain situation?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Human Oversight%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "For high-risk decisions, there should be a defined escalation path — not just an override button. Who reviews high-stakes edge cases? Is there a second-level reviewer? Is there a process for escalating to legal or compliance when an AI-assisted decision may have legal implications?",
    "placeholder": "e.g. Yes — our escalation process: L1 = HR user overrides recommendation. L2 = Senior HR manager reviews overrides for roles above Band 5. L3 = Legal/compliance review for any decision challenged by a candidate...",
    "critical": false,
    "allow_file": true,
    "file_hint": "Deployer Terms, Operator Agreement, Human Oversight T&Cs (PDF)"
  }
$$::jsonb
WHERE question_text = 'Is there a defined process for escalating AI-assisted decisions for human review?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Human Oversight%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 14(4)(e) requires that human operators have the ability to decide not to use the AI system output in a specific situation. This means you must have explicit, documented criteria for when deference to the AI is inappropriate. If you do not have these, operators may not know when they should exercise independent judgement.",
    "placeholder": "e.g. Yes — our Deployer Guide specifies mandatory human decision circumstances: (1) candidate self-declares a disability, (2) role involves security clearance, (3) the AI confidence score is below 60%, (4) the role has fewer than 3 applicants...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Are there explicit circumstances defined where the AI system must defer to a human?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Human Oversight%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 14 places obligations on providers to design systems that enable accountability. But accountability must also be operationally assigned — someone must be responsible for each AI-assisted decision. Describe how you ensure that the human who made or endorsed the final decision is identified and accountable.",
    "placeholder": "e.g. Each final hiring decision in our system is attributed to a named HR user who reviewed and accepted or overrode the AI recommendation. Audit logs capture the decision, the user, and their rationale. This is referenced in our employment law compliance documentation...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'How is accountability assigned for AI-assisted decisions that materially affect individuals?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Human Oversight%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Having an override mechanism is only meaningful if it actually works and is actually used. If overrides are technically possible but socially discouraged, or if the mechanism is too cumbersome to use in practice, the oversight is nominal rather than real. Regular testing and user feedback collection demonstrates maturity.",
    "placeholder": "e.g. Yes — we conduct quarterly tests of the override mechanism, including simulated false positives. We also track override rates in analytics; unexpectedly low override rates trigger a review to check if the mechanism is being used appropriately...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is the human oversight mechanism regularly tested and validated for effectiveness?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Human Oversight%');

-- ── Art. 15 — Accuracy and Robustness ──────────────────────────────────
UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 15(1) requires that high-risk AI systems achieve an appropriate level of accuracy for their intended purpose, and that accuracy metrics are declared. You must have pre-specified accuracy metrics agreed before training — not just post-hoc rationalisation. This is one of the most important questions for technical compliance.",
    "placeholder": "e.g. Yes — we pre-specified our target metrics before model development: Precision@10 >= 85%, Demographic Parity Difference <= 5%. Current performance: P@10 = 87.3%, DPD = 2.1%. Test results documented in our Technical Documentation Pack...",
    "critical": true,
    "allow_file": true,
    "file_hint": "Performance Test Report, Accuracy Benchmarks Document (PDF)"
  }
$$::jsonb
WHERE question_text = 'Has your AI system been tested for accuracy against defined, pre-specified performance benchmarks?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Accuracy%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "This is a factual disclosure question — what are your actual measured accuracy figures on your primary task? Be specific. Vague answers are not acceptable in a compliance assessment. If you do not know your performance figures, that itself is a critical gap.",
    "placeholder": "e.g. Primary task (CV-to-job-description matching): Precision@10 = 87.3% (test set). NDCG@10 = 0.82. AUC-ROC = 0.91. Fairness metrics: Equalised Odds Difference across gender = 0.03...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'What is the measured accuracy or performance of your system on its primary task?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Accuracy%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 15(3) requires robustness against adversarial manipulation, data poisoning, and distributional shift. Testing must include adversarial examples (edge cases designed to fool the system) and out-of-distribution inputs. If you have only tested on clean data, this is a gap.",
    "placeholder": "e.g. Yes — we conducted adversarial robustness testing prior to launch including: (1) keyword stuffing attacks on CVs, (2) distributional shift testing with CVs from sectors outside our training distribution, (3) noise injection testing. Results documented in our test report...",
    "critical": true,
    "allow_file": true,
    "file_hint": "Adversarial Testing Report, Robustness Assessment (PDF)"
  }
$$::jsonb
WHERE question_text = 'Has the system been tested for robustness against adversarial inputs, edge cases, and distributional shift?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Accuracy%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Performance monitoring after deployment is critical. Models can drift as the real world changes — the candidate pool, job market, and language use all evolve. Without post-deployment monitoring, you may not detect degradation before it causes harm.",
    "placeholder": "e.g. Yes — we monitor model performance continuously. Weekly automated reports track Precision@10 on sampled inference logs. Alerts fire if performance drops >5% from baseline. Monthly manual review by ML team...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is system performance continuously monitored after deployment?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Accuracy%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "When errors occur — whether individual wrong scores or systemic failures — you need a defined incident response process. This covers: how errors are detected, who is notified, how affected decisions are reviewed, and what corrective actions are taken. Without a defined process, incidents will be handled ad-hoc with inconsistent outcomes.",
    "placeholder": "e.g. Yes — our incident response process: (1) detection via automated monitoring or user report, (2) severity classification within 2 hours, (3) affected decisions flagged for human review, (4) root cause analysis within 5 days, (5) post-incident report published internally...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Do you have a defined process for responding to system errors, failures, or performance degradation?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Accuracy%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 10(2)(f) and Article 15 together require that systems are evaluated for fairness. For HR tech this is particularly critical as discrimination on protected characteristics (gender, race, age, disability) is both a fundamental rights violation and a legal liability under EU equality law.",
    "placeholder": "e.g. Yes — we evaluate fairness across gender, age group, nationality, and disability status on our quarterly model performance reviews. Metrics: Equalised Odds Difference <= 5% threshold. Last review: December 2024 — within threshold...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Has the system been evaluated for fairness and non-discrimination across demographic groups?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Accuracy%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 15(4) requires that AI systems be resilient to cybersecurity threats. This is technical security — measures to prevent model manipulation, adversarial inputs, data poisoning, or API abuse that could compromise system integrity or outputs.",
    "placeholder": "e.g. We implement: API rate limiting and authentication (API keys + JWT), input validation to reject malformed or oversized inputs, model access controls (inference API is not public), regular penetration testing (last: January 2025)...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'What technical measures are in place to protect the AI system against cybersecurity threats?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Accuracy%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "A fallback mechanism ensures that if the AI system fails or produces unreliable outputs, the process can continue safely without the AI. For HR systems, this might mean reverting to manual CV screening or flagging all affected applications for human review. Without a fallback, a system failure could block critical HR processes.",
    "placeholder": "e.g. Yes — if our system becomes unavailable or returns confidence below our minimum threshold, all applications are automatically placed in a Manual Review Required queue with a notification to the HR team. Manual screening procedures are documented...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is there a fallback mechanism activated if the AI system fails or produces outputs below a reliability threshold?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Accuracy%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Model drift occurs when the statistical patterns the model learned during training no longer match the real-world data it encounters post-deployment. Describe what monitoring you have in place to detect drift and what your response process is when drift is detected.",
    "placeholder": "e.g. We monitor for data drift using Population Stability Index (PSI) on input features weekly. If PSI > 0.25 we trigger a model review. Model retraining is scheduled quarterly. Drift incidents are documented and reviewed by our ML team...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'How do you test for and address performance degradation over time (model drift)?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Accuracy%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "If your system learns continuously or is retrained post-deployment, additional governance is needed. Each retraining cycle must be documented and the new model version must meet the same or better performance standards as the original. Uncontrolled post-deployment learning can introduce new biases or degrade performance.",
    "placeholder": "e.g. We retrain quarterly. Each new model version must pass the same benchmark suite as the initial release before deployment. Retraining data is subject to the same governance process as initial training data. All model versions are archived...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'If continuous learning or post-deployment retraining is used, how is it governed and validated?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Accuracy%');

-- ── Art. 43 — Conformity Assessment ──────────────────────────────────
UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 43 requires providers of high-risk AI systems to undergo a conformity assessment before placing the system on the market. Your first step must be to determine which procedure applies to your system — internal assessment (Annex VI) or third-party notified body assessment (Annex VII). If you have not yet made this determination, this is a critical gap.",
    "placeholder": "e.g. Yes — we determined that our system falls under Annex III point 4 (employment AI). We are proceeding with the internal conformity assessment procedure under Annex VI with planned completion by June 2025...",
    "critical": true,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Have you determined the applicable conformity assessment procedure for your AI system?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Conformity%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Most HR tech AI systems under Annex III point 4 can proceed with internal conformity assessment (Annex VI) rather than requiring a notified body. However, if your system is used in biometric categorisation or makes automated decisions without meaningful human review, a notified body may be required. If you are unsure, legal advice is recommended.",
    "placeholder": "",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is an internal conformity assessment sufficient, or does your system require a notified body?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Conformity%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Annex IV specifies the full list of technical documentation required for conformity assessment. This is distinct from general technical documentation — it specifically must meet the requirements set out in Annex IV. Compiling this documentation is typically a multi-week process if starting from scratch.",
    "placeholder": "e.g. Yes — we have compiled our Annex IV Technical Documentation Pack (TDP). It covers all 7 required sections: general description, design information, monitoring and performance, traceability, training data, validation and testing, and known limitations...",
    "critical": false,
    "allow_file": true,
    "file_hint": "Complete Technical Documentation Pack (Annex IV) (PDF)"
  }
$$::jsonb
WHERE question_text = 'Have you compiled all technical documentation required for conformity assessment?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Conformity%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "A CE marking is required before a high-risk AI system can be placed on the EU market (Article 49). If you are already operating in the EU market without CE marking, you are technically in breach. If CE marking is not yet obtained but you are in the assessment process, document your planned timeline.",
    "placeholder": "e.g. CE marking is planned following completion of our conformity assessment (target Q3 2025). We are not currently in commercial deployment — we are in a controlled pilot phase under a research exemption...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Does your AI system have a CE marking, or is one planned and in progress?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Conformity%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 49(2) requires that providers of high-risk AI systems register their system in the EU AI database managed by the European Commission before market placement. Registration must occur before the CE mark is affixed. If you are already on the market and not registered, this is a compliance gap.",
    "placeholder": "e.g. Registration is planned concurrent with completion of our conformity assessment. We are monitoring the Commission's database launch timeline. Our legal team will manage registration once the database is operational for our system category...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Has your high-risk AI system been registered in the EU AI Act database (if applicable)?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Conformity%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "The EU Declaration of Conformity (DoC) is a formal legal document signed by an authorised representative, stating that the AI system complies with all applicable EU AI Act requirements. Article 47 requires this document to be prepared and signed before CE marking is applied. Without a DoC, you cannot legally affix a CE mark.",
    "placeholder": "e.g. We are preparing our Declaration of Conformity in parallel with our conformity assessment. Draft expected Q2 2025. It will be signed by our CEO as authorised representative and our DPO will countersign on GDPR-related provisions...",
    "critical": true,
    "allow_file": true,
    "file_hint": "EU Declaration of Conformity (signed PDF)"
  }
$$::jsonb
WHERE question_text = 'Do you have or are you preparing an EU Declaration of Conformity?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Conformity%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Article 17 requires providers of high-risk AI systems to implement a Quality Management System (QMS) covering the full lifecycle. This does not require ISO 9001 certification, but the QMS must address all elements specified in Article 17 including documentation, change management, post-market monitoring, and incident reporting.",
    "placeholder": "e.g. Yes — we maintain a documented QMS aligned with Article 17. It covers: design and development procedures, change management, risk management integration, incident reporting, and post-market monitoring. Not yet ISO 9001 certified but compliant with Article 17 structure...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is there a quality management system (QMS) in place that supports your conformity obligations?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Conformity%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "Third-party assessments — even when not strictly required by law — significantly strengthen your compliance posture and provide independent assurance to customers, investors, and regulators. Describe any external audits, penetration tests, bias audits, or ISO certifications you have obtained or are pursuing.",
    "placeholder": "e.g. We completed an independent bias audit by FairTech GmbH in December 2024. Annual penetration testing is conducted by a CREST-certified firm. We are pursuing ISO 42001 (AI Management Systems) certification — assessment scheduled Q3 2025...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Describe any third-party assessments, audits, or certifications conducted on your AI system.'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Conformity%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "ISO 9001 demonstrates a mature quality management system. ISO 42001 is the new AI-specific management system standard that directly maps to EU AI Act requirements. ISO 27001 supports the cybersecurity and data security dimensions. While none are strictly required by the EU AI Act, they significantly simplify conformity assessment.",
    "placeholder": "e.g. We hold ISO 27001 certification (last audit October 2024). We are not currently ISO 9001 or ISO 42001 certified. ISO 42001 certification is under consideration as part of our 2025 compliance roadmap...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'Is your organisation registered under a recognised quality standard (e.g., ISO 9001, ISO 42001)?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Conformity%');

UPDATE diagnostic_questions SET metadata = $$
{
    "help_text": "The August 2, 2026 deadline is the compliance deadline for high-risk AI systems under EU AI Act Article 6. Having a realistic, time-bound plan for completing conformity assessment is critical. If you have no plan, this is itself a critical gap — especially given the lead time required to compile documentation.",
    "placeholder": "e.g. Planned timeline: April 2025 — complete TDP. June 2025 — complete internal conformity assessment. July 2025 — sign Declaration of Conformity. August 2025 — affix CE marking. Contingency built in before August 2026 deadline...",
    "critical": false,
    "allow_file": false
  }
$$::jsonb
WHERE question_text = 'What is your planned timeline for completing conformity assessment and obtaining CE marking?'
  AND obligation_id IN (SELECT id FROM obligations WHERE title ILIKE '%Conformity%');
