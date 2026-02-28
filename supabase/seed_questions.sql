-- ============================================================
-- LexSutra Diagnostic Questions Seed
-- 80 questions total — 10 per obligation
-- Run this AFTER the obligations table has been seeded
-- ============================================================

WITH obligation_ids AS (
  SELECT id,
    CASE
      WHEN title ILIKE '%Risk Management%'         THEN 'risk_mgmt'
      WHEN title ILIKE '%Data Governance%'          THEN 'data_gov'
      WHEN title ILIKE '%Technical Documentation%'  THEN 'tech_doc'
      WHEN title ILIKE '%Logging%'                  THEN 'logging'
      WHEN title ILIKE '%Transparency%'             THEN 'transparency'
      WHEN title ILIKE '%Human Oversight%'          THEN 'human_oversight'
      WHEN title ILIKE '%Accuracy%'                 THEN 'accuracy'
      WHEN title ILIKE '%Conformity%'               THEN 'conformity'
    END AS key
  FROM obligations
),
questions (obligation_key, order_index, question_text, question_type, metadata) AS (
  VALUES

  -- ── Art. 9 — Risk Management System ──────────────────────────
  ('risk_mgmt', 1,  'Does your organisation have a documented AI risk management system?',                                 'yes_no', '{}'),
  ('risk_mgmt', 2,  'How frequently is your risk management process reviewed and updated?',                               'select', '{"options":["Continuously","Annually","Ad-hoc","Not reviewed"]}'),
  ('risk_mgmt', 3,  'Describe how risks specific to your AI system are identified and assessed.',                          'text',   '{}'),
  ('risk_mgmt', 4,  'Have you identified the intended purpose and foreseeable misuse cases of your AI system?',           'yes_no', '{}'),
  ('risk_mgmt', 5,  'Who within your organisation is responsible for AI risk management?',                                 'text',   '{}'),
  ('risk_mgmt', 6,  'Do you conduct formal risk assessments before each deployment or significant update?',                'yes_no', '{}'),
  ('risk_mgmt', 7,  'Are risk mitigation measures documented, tested, and tracked?',                                       'yes_no', '{}'),
  ('risk_mgmt', 8,  'Describe any residual risks identified and how they are communicated to deployers.',                  'text',   '{}'),
  ('risk_mgmt', 9,  'Is your AI risk management system integrated with your broader organisational risk framework?',       'yes_no', '{}'),
  ('risk_mgmt', 10, 'Have you assessed risks arising from the interaction between your AI system and its end users?',     'yes_no', '{}'),

  -- ── Art. 10 — Data Governance ────────────────────────────────
  ('data_gov', 1,  'What types of data does your AI system use for training, validation, and testing?',                   'text',   '{}'),
  ('data_gov', 2,  'Do you maintain documentation of your training datasets including provenance and characteristics?',   'yes_no', '{}'),
  ('data_gov', 3,  'How do you ensure training data is relevant, representative, and free from significant errors?',      'text',   '{}'),
  ('data_gov', 4,  'Have you conducted a formal assessment of your training data for potential biases?',                  'yes_no', '{}'),
  ('data_gov', 5,  'Do you have data governance policies covering collection, storage, retention, and access control?',   'yes_no', '{}'),
  ('data_gov', 6,  'Is personally identifiable information (PII) used during training or inference?',                    'yes_no', '{}'),
  ('data_gov', 7,  'How is data quality monitored on an ongoing basis after the model is deployed?',                     'text',   '{}'),
  ('data_gov', 8,  'Do you have a process for correcting or removing inaccurate, outdated, or biased data?',             'yes_no', '{}'),
  ('data_gov', 9,  'Where is your training and operational data stored, and under what legal jurisdiction?',              'text',   '{}'),
  ('data_gov', 10, 'Do you conduct regular bias audits across protected demographic characteristics?',                    'yes_no', '{}'),

  -- ── Art. 11 & Annex IV — Technical Documentation ─────────────
  ('tech_doc', 1,  'Do you maintain technical documentation describing the AI system design and development process?',    'yes_no', '{}'),
  ('tech_doc', 2,  'Does your documentation include the intended purpose, scope, and conditions of use?',                 'yes_no', '{}'),
  ('tech_doc', 3,  'Is your system architecture — including model type, training procedure, and component interaction — documented?', 'yes_no', '{}'),
  ('tech_doc', 4,  'Do you document training data characteristics, pre-processing methodologies, and data splits?',      'yes_no', '{}'),
  ('tech_doc', 5,  'Is your validation and testing methodology, including test datasets and metrics, documented?',        'yes_no', '{}'),
  ('tech_doc', 6,  'How is technical documentation kept up to date when the AI system is changed or updated?',           'text',   '{}'),
  ('tech_doc', 7,  'Is your technical documentation accessible to competent authorities upon formal request?',            'yes_no', '{}'),
  ('tech_doc', 8,  'Do you use version control for your technical documentation?',                                        'yes_no', '{}'),
  ('tech_doc', 9,  'Describe the overall AI system design, its main components, and how they interact.',                  'text',   '{}'),
  ('tech_doc', 10, 'Are known limitations, performance boundaries, and foreseeable risks explicitly documented?',         'yes_no', '{}'),

  -- ── Art. 12 — Logging and Record Keeping ─────────────────────
  ('logging', 1,  'Does your AI system automatically generate logs of events during operation?',                          'yes_no', '{}'),
  ('logging', 2,  'What types of events are captured in your logs (e.g., inputs, outputs, decisions, errors)?',          'text',   '{}'),
  ('logging', 3,  'What is your current log retention period?',                                                           'select', '{"options":["Less than 6 months","6–12 months","1–3 years","More than 3 years","Not defined"]}'),
  ('logging', 4,  'Are logs stored securely with access controls and tamper-prevention measures?',                        'yes_no', '{}'),
  ('logging', 5,  'Can your logs enable post-hoc traceability of individual AI system decisions?',                        'yes_no', '{}'),
  ('logging', 6,  'Do logs capture both the input data and the corresponding output or decision for each inference?',     'yes_no', '{}'),
  ('logging', 7,  'Is there a defined process for reviewing logs to detect anomalies, errors, or incidents?',             'yes_no', '{}'),
  ('logging', 8,  'Can logs be made available to competent authorities on request?',                                      'yes_no', '{}'),
  ('logging', 9,  'Describe what information is captured at each significant decision point in your system.',             'text',   '{}'),
  ('logging', 10, 'Are log integrity mechanisms in place to detect tampering or deletion?',                               'yes_no', '{}'),

  -- ── Art. 13 — Transparency ───────────────────────────────────
  ('transparency', 1,  'Are end users clearly informed when they are interacting with an AI system?',                     'yes_no', '{}'),
  ('transparency', 2,  'Do you provide clear, accessible instructions for use to operators and deployers?',               'yes_no', '{}'),
  ('transparency', 3,  'Is information about the AI system''s capabilities and limitations communicated to users?',       'yes_no', '{}'),
  ('transparency', 4,  'Is documentation available in a language and format understandable to non-technical deployers?',  'yes_no', '{}'),
  ('transparency', 5,  'Do you disclose the intended purpose, applicable use cases, and conditions of use?',              'yes_no', '{}'),
  ('transparency', 6,  'How do you communicate significant limitations that could affect outputs or safety?',              'text',   '{}'),
  ('transparency', 7,  'Is there a mechanism for users to flag concerns, unexpected behaviour, or potential errors?',      'yes_no', '{}'),
  ('transparency', 8,  'Are transparency obligations communicated to parties throughout your supply chain?',               'yes_no', '{}'),
  ('transparency', 9,  'Describe what information is provided to users before they first interact with the AI system.',    'text',   '{}'),
  ('transparency', 10, 'Do you publicly publish performance metrics or accuracy benchmarks for your AI system?',          'yes_no', '{}'),

  -- ── Art. 14 — Human Oversight ────────────────────────────────
  ('human_oversight', 1,  'Is there a mechanism for a human to intervene, override, or halt the AI system?',             'yes_no', '{}'),
  ('human_oversight', 2,  'Are human overseers formally trained to understand the system''s capabilities and limitations?', 'yes_no', '{}'),
  ('human_oversight', 3,  'Is the AI system designed to be interpretable or explainable to its operators?',               'yes_no', '{}'),
  ('human_oversight', 4,  'Can the system flag situations where it is uncertain or where human oversight is recommended?', 'yes_no', '{}'),
  ('human_oversight', 5,  'Describe the human oversight procedures in place during normal operation.',                    'text',   '{}'),
  ('human_oversight', 6,  'What happens when the AI system encounters an out-of-scope input or uncertain situation?',     'text',   '{}'),
  ('human_oversight', 7,  'Is there a defined process for escalating AI-assisted decisions for human review?',            'yes_no', '{}'),
  ('human_oversight', 8,  'Are there explicit circumstances defined where the AI system must defer to a human?',          'yes_no', '{}'),
  ('human_oversight', 9,  'How is accountability assigned for AI-assisted decisions that materially affect individuals?', 'text',   '{}'),
  ('human_oversight', 10, 'Is the human oversight mechanism regularly tested and validated for effectiveness?',            'yes_no', '{}'),

  -- ── Art. 15 — Accuracy and Robustness ────────────────────────
  ('accuracy', 1,  'Has your AI system been tested for accuracy against defined, pre-specified performance benchmarks?',  'yes_no', '{}'),
  ('accuracy', 2,  'What is the measured accuracy or performance of your system on its primary task?',                    'text',   '{}'),
  ('accuracy', 3,  'Has the system been tested for robustness against adversarial inputs, edge cases, and distributional shift?', 'yes_no', '{}'),
  ('accuracy', 4,  'Is system performance continuously monitored after deployment?',                                      'yes_no', '{}'),
  ('accuracy', 5,  'Do you have a defined process for responding to system errors, failures, or performance degradation?', 'yes_no', '{}'),
  ('accuracy', 6,  'Has the system been evaluated for fairness and non-discrimination across demographic groups?',        'yes_no', '{}'),
  ('accuracy', 7,  'What technical measures are in place to protect the AI system against cybersecurity threats?',        'text',   '{}'),
  ('accuracy', 8,  'Is there a fallback mechanism activated if the AI system fails or produces outputs below a reliability threshold?', 'yes_no', '{}'),
  ('accuracy', 9,  'How do you test for and address performance degradation over time (model drift)?',                    'text',   '{}'),
  ('accuracy', 10, 'If continuous learning or post-deployment retraining is used, how is it governed and validated?',     'text',   '{}'),

  -- ── Art. 43 & Annex VI/VII — Conformity Assessment ───────────
  ('conformity', 1,  'Have you determined the applicable conformity assessment procedure for your AI system?',            'yes_no', '{}'),
  ('conformity', 2,  'Is an internal conformity assessment sufficient, or does your system require a notified body?',    'select', '{"options":["Internal assessment sufficient","Notified body required","Not yet determined"]}'),
  ('conformity', 3,  'Have you compiled all technical documentation required for conformity assessment?',                 'yes_no', '{}'),
  ('conformity', 4,  'Does your AI system have a CE marking, or is one planned and in progress?',                        'yes_no', '{}'),
  ('conformity', 5,  'Has your high-risk AI system been registered in the EU AI Act database (if applicable)?',           'yes_no', '{}'),
  ('conformity', 6,  'Do you have or are you preparing an EU Declaration of Conformity?',                                 'yes_no', '{}'),
  ('conformity', 7,  'Is there a quality management system (QMS) in place that supports your conformity obligations?',   'yes_no', '{}'),
  ('conformity', 8,  'Describe any third-party assessments, audits, or certifications conducted on your AI system.',      'text',   '{}'),
  ('conformity', 9,  'Is your organisation registered under a recognised quality standard (e.g., ISO 9001, ISO 42001)?', 'yes_no', '{}'),
  ('conformity', 10, 'What is your planned timeline for completing conformity assessment and obtaining CE marking?',       'text',   '{}')
)
INSERT INTO diagnostic_questions (obligation_id, order_index, question_text, question_type, metadata)
SELECT o.id, q.order_index, q.question_text, q.question_type, q.metadata::jsonb
FROM questions q
JOIN obligation_ids o ON o.key = q.obligation_key
WHERE o.key IS NOT NULL
ON CONFLICT DO NOTHING;
