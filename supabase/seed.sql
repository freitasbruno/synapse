-- =============================================================
-- Synapse: Seed Data
-- =============================================================
-- Placeholder user (all seed assets belong to this user)
INSERT INTO users (id, auth_id, display_name, email, role, profile_complete, contributions_count)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Synapse Seed',
  'seed@synapse.dev',
  'manager',
  true,
  12
) ON CONFLICT DO NOTHING;

-- =============================================================
-- PROMPTS (3)
-- =============================================================
INSERT INTO assets (
  id, creator_id, title, type, description, tags, status,
  vote_count, star_count, comment_count, view_count,
  is_manager_validated, validation_score, created_at
) VALUES

(
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Chain-of-Thought Math Tutor',
  'prompt',
  'A structured prompt that guides an LLM to solve math problems step-by-step, showing its reasoning at each stage. Ideal for educational contexts where understanding the process matters as much as the answer. Works well with GPT-4 and Claude.',
  ARRAY['math', 'education', 'reasoning', 'chain-of-thought'],
  'published',
  189, 234, 45, 3210,
  true, 0.92,
  now() - INTERVAL '30 days'
),

(
  'a0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Code Review & Refactor Guide',
  'prompt',
  'Drop in any function or class and receive a structured review covering readability, performance, error handling, and security — plus a refactored version with inline comments explaining every change.',
  ARRAY['code-review', 'refactoring', 'best-practices', 'developer'],
  'published',
  67, 89, 23, 1420,
  false, 0,
  now() - INTERVAL '20 days'
),

(
  'a0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Creative Narrative Builder',
  'prompt',
  'Transform a simple premise into a fully fleshed short story with three-act structure, character arcs, and vivid sensory details. Includes genre-aware tone adjustments for sci-fi, fantasy, thriller, and literary fiction.',
  ARRAY['creative-writing', 'storytelling', 'fiction', 'narrative'],
  'published',
  123, 156, 31, 2100,
  true, 0.87,
  now() - INTERVAL '45 days'
),

-- =============================================================
-- TOOLS (3)
-- =============================================================

(
  'a0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'GitHub PR Auto-Summarizer',
  'tool',
  'Paste a GitHub pull request diff and receive a concise, reviewer-ready summary: what changed, why it matters, risks introduced, and suggested review focus areas. Saves reviewers 10–15 minutes per PR.',
  ARRAY['github', 'devops', 'productivity', 'code-review'],
  'published',
  267, 312, 78, 5400,
  true, 0.95,
  now() - INTERVAL '60 days'
),

(
  'a0000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'SQL Query Optimizer',
  'tool',
  'Analyzes slow SQL queries and suggests index strategies, rewrite patterns, and execution plan improvements. Supports PostgreSQL, MySQL, and SQLite dialects. Outputs both the optimized query and a plain-English explanation.',
  ARRAY['sql', 'database', 'performance', 'postgresql'],
  'published',
  51, 67, 12, 890,
  false, 0,
  now() - INTERVAL '10 days'
),

(
  'a0000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'JSON Schema Validator & Fixer',
  'tool',
  'Paste a JSON payload alongside its schema; the tool identifies all validation errors, explains each violation in plain English, and returns a corrected payload. Useful for API debugging and contract testing.',
  ARRAY['json', 'validation', 'api', 'debugging'],
  'published',
  38, 45, 8, 672,
  false, 0,
  now() - INTERVAL '5 days'
),

-- =============================================================
-- APPS (3)
-- =============================================================

(
  'a0000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  'AI Mock Interview Coach',
  'app',
  'Simulates technical and behavioural interviews for software engineering roles. Adapts question difficulty to your responses, provides real-time feedback on clarity and depth, and generates a performance report with actionable improvement areas.',
  ARRAY['interview', 'career', 'ai', 'software-engineering'],
  'published',
  389, 445, 102, 8900,
  true, 0.98,
  now() - INTERVAL '90 days'
),

(
  'a0000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000001',
  'Resume Tailoring Assistant',
  'app',
  'Paste a job description and your current resume; the app rewrites your experience bullets to match the role''s language and highlights transferable skills. Also scores your resume against ATS keyword requirements.',
  ARRAY['resume', 'job-search', 'career', 'ats'],
  'published',
  145, 178, 67, 3400,
  false, 0,
  now() - INTERVAL '35 days'
),

(
  'a0000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000001',
  'Meeting Transcript Summarizer',
  'app',
  'Upload a raw meeting transcript and receive structured output: a TL;DR, key decisions, action items with owners, open questions, and a sentiment analysis of the discussion. Exports to Markdown, Notion, or Slack format.',
  ARRAY['productivity', 'meetings', 'ai', 'summarization'],
  'published',
  187, 223, 54, 4100,
  true, 0.91,
  now() - INTERVAL '55 days'
),

-- =============================================================
-- WORKFLOWS (3)
-- =============================================================

(
  'a0000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Blog Post Generation Pipeline',
  'workflow',
  'A multi-step workflow that takes a topic and target audience, researches the subject, creates an SEO-optimised outline, drafts the full post with headings and examples, then polishes tone and readability. Includes a meta description and social preview.',
  ARRAY['content', 'blogging', 'seo', 'marketing'],
  'published',
  312, 389, 89, 6700,
  true, 0.96,
  now() - INTERVAL '75 days'
),

(
  'a0000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'Customer Feedback Triage',
  'workflow',
  'Ingests raw customer feedback (reviews, support tickets, survey responses), classifies each item by sentiment and category, surfaces recurring themes, and produces a prioritised action report for product and support teams.',
  ARRAY['customer-success', 'nlp', 'automation', 'product'],
  'published',
  108, 134, 41, 2300,
  false, 0,
  now() - INTERVAL '25 days'
),

(
  'a0000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000001',
  'Research Paper Digest',
  'workflow',
  'Feed in an academic PDF or arXiv URL and receive: abstract simplification, key contributions, methodology breakdown, limitations, and real-world application ideas — all formatted for a technical but non-specialist audience.',
  ARRAY['research', 'summarization', 'academic', 'nlp'],
  'published',
  43, 56, 15, 980,
  false, 0,
  now() - INTERVAL '15 days'
);
