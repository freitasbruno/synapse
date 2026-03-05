# Synapse

> An open-access community portal for discovering and sharing AI assets — prompts, tools, apps, and workflows.

Synapse is built by Bitlab to solve the "blank page" problem for AI creators. Browse and copy AI assets freely with no account required. Authenticated members can contribute assets, star favourites, comment, and use the AI-powered refinement tools to polish their work before publishing.

---

## Live App

**Production:** [https://synapsebitlab.vercel.app](https://synapsebitlab.vercel.app)

---

## Features

### For Visitors (no account required)
- Browse the full asset gallery with real-time search and filtering
- Filter by asset type (Prompt, Tool, App, Workflow) and tags
- Sort by newest or most popular
- View full asset documentation with markdown, images, and video
- Copy prompt text to clipboard in one click
- Visit external resources linked to tools and apps

### For Members (authenticated)
- Submit new assets with a rich sequence-based editor
- Add text/markdown blocks, images, and video clips
- Use the AI "Review & Refine" assistant (powered by Claude) to improve content
- Get AI-generated tag suggestions based on asset content
- Save drafts and preview before publishing
- Star assets and post comments
- Manage your own assets from a personal dashboard

### For Managers
- Toggle a gold "Verified" badge on high-quality assets
- Access the admin dashboard with platform growth metrics
- Monitor AI usage and estimated API costs
- Full asset oversight table with validate, delete, and batch actions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (Google OAuth + Email/Password) |
| AI | Anthropic Claude via Vercel AI SDK |
| File Storage | Supabase Storage |
| Hosting | Vercel |
| Version Control | GitHub |

---

## Project Structure

```
/
├── app/                          # Next.js App Router pages and API routes
│   ├── page.tsx                  # Discovery Gallery (home)
│   ├── asset/[id]/               # Asset detail page
│   │   ├── page.tsx
│   │   └── edit/page.tsx         # Asset editor (authenticated)
│   ├── submit/page.tsx           # Create new asset (authenticated)
│   ├── dashboard/page.tsx        # Creator's asset dashboard
│   ├── profile/page.tsx          # User profile page
│   ├── onboarding/page.tsx       # First-login profile setup
│   ├── admin/                    # Manager-only dashboard
│   │   ├── layout.tsx
│   │   ├── overview/page.tsx     # Platform growth metrics
│   │   ├── ai-usage/page.tsx     # AI cost monitoring
│   │   └── assets/page.tsx       # Content oversight table
│   └── api/                      # Route Handlers (backend)
│       ├── assets/[id]/
│       │   ├── view/route.ts     # Increment view count
│       │   ├── star/route.ts     # Toggle star
│       │   ├── validate/route.ts # Manager validation toggle
│       │   ├── comments/route.ts # Post comment
│       │   └── route.ts          # Delete asset
│       ├── comments/[id]/route.ts # Delete comment
│       ├── refine/route.ts        # AI refinement (Claude)
│       ├── suggest-tags/route.ts  # AI tag suggestions (Claude)
│       └── auth/callback/route.ts # OAuth callback handler
│
├── components/
│   ├── layout/
│   │   └── Header.tsx            # Global navigation header
│   ├── providers/
│   │   └── ThemeProvider.tsx     # Dark/light mode context
│   ├── gallery/
│   │   ├── GalleryClient.tsx     # Interactive gallery (search, filter, sort)
│   │   └── AssetCard.tsx         # Individual asset card
│   ├── asset/
│   │   ├── SequenceRenderer.tsx  # Renders markdown/image/video blocks
│   │   ├── CommentSection.tsx    # Comment thread
│   │   ├── CommentItem.tsx       # Individual comment
│   │   └── ViewTracker.tsx       # Fires view count increment on mount
│   ├── editor/
│   │   ├── AssetEditor.tsx       # Core create/edit editor
│   │   ├── SequenceBuilder.tsx   # Drag/add/remove content blocks
│   │   ├── RefinementModal.tsx   # AI review and refine modal
│   │   └── AIStatusIndicator.tsx # Animated loading indicator
│   └── ui/
│       ├── ActionButtons.tsx     # Copy Prompt + Visit Resource buttons
│       ├── StarButton.tsx        # Star toggle with optimistic updates
│       ├── TagBadge.tsx          # Clickable tag pill
│       ├── GoldBadge.tsx         # Manager verified badge
│       ├── ValidationToggle.tsx  # Manager validation control
│       └── Toast.tsx             # Error/feedback notifications
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   └── middleware.ts         # Session refresh logic
│   ├── data/
│   │   ├── assets.ts             # Asset data fetching functions
│   │   ├── users.ts              # User data functions
│   │   ├── comments.ts           # Comment data functions
│   │   └── admin.ts              # Admin analytics queries
│   ├── auth/
│   │   └── session.ts            # getSession / getCurrentUser helpers
│   ├── storage/
│   │   └── upload.ts             # Supabase Storage upload/delete
│   ├── utils/
│   │   ├── format.ts             # formatCount() and other formatters
│   │   └── content.ts            # assembleAssetContent() helper
│   └── types/
│       └── database.ts           # Full TypeScript types for all tables
│
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql  # Full database schema
│   └── seed.sql                     # Sample assets for development
│
├── middleware.ts                 # Route protection + session refresh
├── tailwind.config.ts
├── next.config.ts
└── .env.local                    # Local secrets (git-ignored)
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Member profiles, roles, and contribution counts |
| `assets` | All AI assets (prompts, tools, apps, workflows) |
| `comments` | Asset discussion threads |
| `votes` | Star/vote records (userId_assetId composite key) |
| `activity_logs` | Copy and AI trigger events |
| `ai_usage_logs` | Per-request Claude API token usage |
| `system_stats` | Aggregated daily platform statistics |

Row Level Security (RLS) is enabled on all tables. Public users can read published assets and comments. Write access requires authentication. Manager-only operations are enforced at both the API route and RLS policy levels.

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 20+
- Docker Desktop (for local Supabase)
- Supabase CLI
- A Supabase project
- An Anthropic API key

### 1. Clone and install

```bash
git clone https://github.com/your-org/synapse.git
cd synapse
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run the database migration

```bash
supabase db push
```

Or apply manually via the Supabase SQL Editor using `/supabase/migrations/0001_initial_schema.sql`.

### 4. Seed sample data (optional)

Run `/supabase/seed.sql` in the Supabase SQL Editor to populate the gallery with sample assets.

### 5. Set up Supabase Storage

In the Supabase dashboard:
- Create a storage bucket named `assets` (private)
- Add the four storage policies described in the Storage Setup section below

### 6. Configure Google OAuth

In the Supabase dashboard → Authentication → Providers → Google:
- Enable the Google provider
- Add your Google OAuth Client ID and Secret
- Add `http://localhost:3000` to authorised origins in Google Cloud Console
- Add `http://localhost:54321/auth/v1/callback` to authorised redirect URIs

### 7. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Storage Setup

Create a bucket named `assets` (private) and add these policies:

| Policy | Operation | Role | Definition |
|---|---|---|---|
| Authenticated users can upload | INSERT | authenticated | `bucket_id = 'assets'` |
| Users can update own files | UPDATE | authenticated | `bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]` |
| Users can delete own files | DELETE | authenticated | `bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]` |
| Public can read assets | SELECT | public | `bucket_id = 'assets'` |

---

## Promoting a User to Manager

Manager role is assigned manually via the Supabase SQL Editor:

```sql
UPDATE users SET role = 'manager' 
WHERE email = 'manager@example.com';
```

Managers gain access to:
- The gold Verified badge toggle on any asset detail page
- The `/admin` dashboard (overview, AI usage, asset oversight)
- The ability to delete any comment or asset

---

## Environment Variables Reference

| Variable | Where | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | Supabase publishable key (safe to expose) |
| `SUPABASE_SECRET_KEY` | Server only | Supabase secret key (never expose to client) |
| `ANTHROPIC_API_KEY` | Server only | Anthropic API key for Claude |
| `NEXT_PUBLIC_SITE_URL` | Client + Server | Full URL of your deployment (no trailing slash) |

All server-only variables must also be added to Vercel → Settings → Environment Variables for production.

---

## Deployment

The project deploys automatically to Vercel on every push to `main`.

1. Connect your GitHub repo to Vercel
2. Add all environment variables in the Vercel dashboard
3. Push to `main` — Vercel builds and deploys automatically

Preview deployments are created for every branch and pull request.

---

## AI Features

### Review & Refine
Available to authenticated members in the asset editor. Each text block has a "✨ Refine" button that sends the content to Claude (`claude-sonnet-4-20250514`) via a secure server-side API route. The AI returns an improved version in a side-by-side comparison modal. The user can accept, iterate with custom instructions, or discard.

### Tag Suggestions
After accepting a refinement, Claude automatically suggests 3-5 relevant tags based on the asset content. Suggestions appear as clickable chips that add instantly to the asset's tag list.

All AI calls are authenticated, server-side only, and logged to `ai_usage_logs` for cost monitoring in the admin dashboard.

---

## Contributing

This is an internal Bitlab project. To contribute:

1. Create a feature branch from `main`
2. Make your changes
3. Run `npx tsc --noEmit` and `npm run lint` — both must pass
4. Push and open a pull request
5. Vercel will create a preview deployment automatically
6. Request review — merge after approval

---

## License

Internal use only. © Bitlab.
