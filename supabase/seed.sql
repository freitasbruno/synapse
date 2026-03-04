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

-- =============================================================
-- DESCRIPTION SEQUENCES (4 selected assets)
-- =============================================================

-- Asset 1: Chain-of-Thought Math Tutor (text blocks with code)
UPDATE assets SET description_sequence = '[
  {
    "type": "text",
    "content": "## Overview\n\nThis prompt engineers an LLM to **show its reasoning explicitly** at every step of a maths problem — not just produce an answer. It is modelled after the chain-of-thought (CoT) technique introduced by Wei et al. (2022) and consistently improves accuracy on multi-step problems.\n\n> Works best with models that have strong instruction-following ability: GPT-4, Claude 3.5+, Gemini 1.5 Pro."
  },
  {
    "type": "text",
    "content": "## The Prompt\n\n```text\nYou are a patient maths tutor. When given a problem:\n1. Restate the problem in your own words.\n2. Identify what is being asked and what information is given.\n3. Choose a solution strategy and explain why.\n4. Work through each step, labelling it clearly (Step 1, Step 2 …).\n5. State the final answer in a box: **Answer: [value]**\n6. Do a quick sanity-check — does the answer make sense?\n\nDo NOT skip steps even if the problem seems trivial.\n```"
  },
  {
    "type": "text",
    "content": "## Python Integration\n\nYou can wire this prompt into any OpenAI-compatible API:\n\n```python\nimport openai\n\nSYSTEM_PROMPT = \"\"\"\nYou are a patient maths tutor. When given a problem:\n1. Restate the problem in your own words.\n2. Identify what is being asked and what information is given.\n3. Choose a solution strategy and explain why.\n4. Work through each step, labelling it clearly.\n5. State the final answer in a box: **Answer: [value]**\n6. Sanity-check the result.\n\"\"\"\n\ndef solve(problem: str) -> str:\n    response = openai.chat.completions.create(\n        model=\"gpt-4o\",\n        messages=[\n            {\"role\": \"system\", \"content\": SYSTEM_PROMPT},\n            {\"role\": \"user\",   \"content\": problem},\n        ],\n        temperature=0.2,   # low temp for deterministic reasoning\n    )\n    return response.choices[0].message.content\n\nif __name__ == \"__main__\":\n    print(solve(\"A train travels 120 km in 1.5 hours. What is its average speed?\"))\n```"
  },
  {
    "type": "text",
    "content": "## Tips & Variations\n\n- **Temperature** — Keep it at 0.0–0.3 for consistent step-by-step output.\n- **Few-shot variant** — Prepend 2–3 worked examples before the user question to further anchor the format.\n- **Self-consistency** — Sample the same question 5 times and take the majority answer for higher-stakes scenarios.\n- **Multilingual** — The prompt works in any language; just write the instruction in the target language.\n\n### Benchmarks\n\n| Model | GSM8K (0-shot) | GSM8K (CoT) |\n|---|---|---|\n| GPT-3.5 | 57% | 78% |\n| GPT-4 | 82% | 97% |\n| Claude 3.5 Sonnet | 88% | 98% |"
  }
]'::jsonb
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Asset 4: GitHub PR Auto-Summarizer (text + image + text)
UPDATE assets SET description_sequence = '[
  {
    "type": "text",
    "content": "## What It Does\n\nPaste a raw GitHub pull request diff and the tool returns a **structured, reviewer-ready summary** in under five seconds. It extracts:\n\n- A one-sentence TL;DR\n- Files changed and their purpose\n- Risk areas and suggested test cases\n- Reviewer focus checklist\n\nThe output format is Markdown, suitable for pasting directly into a PR comment or a Slack message."
  },
  {
    "type": "image",
    "url": "https://placehold.co/800x450/1a1a1a/6366f1?text=PR+Summary+Output",
    "caption": "Example output for a 12-file refactoring PR — generated in ~3 seconds"
  },
  {
    "type": "text",
    "content": "## Usage\n\nCopy the diff output from GitHub (or `git diff main...feature-branch`) and paste it after the instruction below.\n\n```text\nYou are a senior software engineer performing a code review.\nGiven the following pull request diff, produce:\n\n1. **TL;DR** (1 sentence)\n2. **Changes summary** — bullet list, grouped by file or concern\n3. **Risk areas** — anything that could break in production\n4. **Suggested tests** — what the reviewer should manually verify\n5. **Reviewer checklist** — 3–5 actionable items\n\nFormat your response in clean Markdown.\n\n---DIFF---\n[paste diff here]\n```\n\n## Integration with GitHub Actions\n\n```yaml\n# .github/workflows/pr-summary.yml\nname: PR Summary\non:\n  pull_request:\n    types: [opened, synchronize]\n\njobs:\n  summarize:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          fetch-depth: 0\n\n      - name: Generate diff\n        run: git diff origin/main...HEAD > /tmp/pr.diff\n\n      - name: Post summary\n        env:\n          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}\n          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n        run: |\n          python scripts/summarize_pr.py /tmp/pr.diff\n```"
  }
]'::jsonb
WHERE id = 'a0000000-0000-0000-0000-000000000004';

-- Asset 7: AI Mock Interview Coach (text + video + text)
UPDATE assets SET description_sequence = '[
  {
    "type": "text",
    "content": "## How the Coach Works\n\nThe AI Mock Interview Coach simulates a full 45-minute technical interview loop. It adapts question difficulty in real time based on your previous answers — if you nail a question, the next one is harder; if you struggle, it offers a hint before escalating.\n\n### Interview Modes\n\n| Mode | Duration | Focus |\n|---|---|---|\n| Warm-up | 10 min | Easy LC-style problems |\n| Standard | 30 min | Medium algorithms + system design |\n| FAANG Prep | 60 min | Hard problems + behavioural |\n| Behavioural only | 20 min | STAR-format soft-skill questions |"
  },
  {
    "type": "video",
    "url": "https://www.w3schools.com/html/mov_bbb.mp4",
    "caption": "Demo: 2-minute walkthrough of a Standard mode session"
  },
  {
    "type": "text",
    "content": "## Example Session Transcript\n\n```\nCoach: Let''s start with a warm-up. Given an array of integers, return\n       the indices of the two numbers that add up to a target.\n\nYou:   I''ll use a hash map. For each element I store its complement...\n\nCoach: Good — O(n) time. Now handle duplicates in the input array.\n\nYou:   If the same value appears twice, I need to check the index isn''t\n       the same as the stored one...\n\nCoach: Exactly right. Here''s a follow-up: what if the array is sorted?\n       Can you do better than O(n) space?\n```\n\n## Performance Report (sample)\n\nAfter each session you receive:\n\n- **Score** per question (correctness, time, communication)\n- **Identified gaps** (e.g. \"Struggles with graph traversal\")\n- **Recommended study topics** with links\n- **Transcript** for self-review"
  }
]'::jsonb
WHERE id = 'a0000000-0000-0000-0000-000000000007';

-- Asset 10: Blog Post Generation Pipeline (text + image + text)
UPDATE assets SET description_sequence = '[
  {
    "type": "text",
    "content": "## Pipeline Overview\n\nThis multi-step workflow turns a **topic + audience** pair into a publish-ready blog post in four stages:\n\n1. **Research** — web search + source synthesis\n2. **Outline** — SEO-optimised H2/H3 structure with keyword targets\n3. **Draft** — full prose with examples, analogies, and data\n4. **Polish** — tone, readability score, meta description, social previews\n\nEach stage can be run independently or chained end-to-end."
  },
  {
    "type": "image",
    "url": "https://placehold.co/800x450/0f0f0f/6366f1?text=Pipeline+Diagram",
    "caption": "Four-stage pipeline from topic to publish-ready post"
  },
  {
    "type": "text",
    "content": "## Stage Prompts\n\n### Stage 1 — Research\n\n```text\nTopic: {topic}\nTarget audience: {audience}\nGoal: Identify the 5 most important sub-topics, key statistics, and\n      authoritative sources. Output as structured JSON:\n{\n  \"sub_topics\": [...],\n  \"key_stats\":  [...],\n  \"sources\":    [...]\n}\n```\n\n### Stage 2 — Outline\n\n```text\nGiven the research below, create an SEO-optimised blog post outline.\nPrimary keyword: {primary_kw}\nSecondary keywords: {secondary_kws}\n\nRequirements:\n- H1 title (include primary keyword)\n- Introduction hook (question or statistic)\n- 4–6 H2 sections with H3 sub-points\n- Conclusion with CTA\n- Estimated word count per section\n```\n\n### Stage 4 — Polish\n\n```text\nReview the draft below and:\n1. Improve any passive-voice sentences\n2. Replace jargon with plain language where possible\n3. Add a meta description (150–160 chars, include primary keyword)\n4. Write 3 social preview variants (Twitter, LinkedIn, newsletter)\n5. Rate readability: Flesch–Kincaid grade level target ≤ 10\n```\n\n## Supported Output Formats\n\n- `markdown` — clean `.md` file ready for any CMS\n- `notion` — Notion API block format\n- `wordpress` — Gutenberg-compatible JSON blocks\n- `html` — standalone article with semantic tags"
  }
]'::jsonb
WHERE id = 'a0000000-0000-0000-0000-000000000010';
