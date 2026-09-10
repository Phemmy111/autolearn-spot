# AutoLearn Spot - Project Handoff

## Project Context

**Repository:** `Phemmy111/autolearn-spot`
**Local Path:** `C:\Users\ACER\Desktop\autolearn-spot`
**Remote:** `https://github.com/Phemmy111/autolearn-spot.git`
**Branch:** `main`

### Project Goal

AutoLearn Spot is being repositioned from a cohort/course-focused application into a **digital skills marketplace** with distinct experiences:
1. Public Marketplace
2. Student Experience
3. Author Studio
4. Admin Portal
5. ALEX (AI System)

The existing backend/domain foundation (Clerk auth, Supabase, Paystack, author/student systems, admin functionality, ALEX) must be preserved while rebuilding the frontend in a controlled manner.

---

## Current Session Work

### Task: Author Application Workflow

We are implementing a professional author onboarding and approval workflow.

### Latest Work Completed

**1. Form Redesign (by external AI agent)**
- Redesigned `app/author-apply/page.tsx` to match reference image
- Added extensive form fields:
  - Personal: Full Name, Email, Phone (+234 country code), Location
  - Professional: Professional Title, Years of Experience, LinkedIn, Website/Portfolio
  - Expertise: Checkbox grid (AI & Automation, Web Dev, Mobile Dev, Data Science, Digital Marketing, Design & UX, Business, Other)
  - About: Bio textarea
  - Documents: CV, Portfolio, ID Document (file uploads)
- Added sidebar with benefits and "How It Works" section
- Maintained authentication flow (sign-in/sign-up options before form)

**2. Backend Connectivity (this session)**
- Created migration `migrations/update-author-applications.sql`:
  - Added columns: email, phone, location, professional_title, years_of_experience, linkedin_profile, website_portfolio, cv_url, portfolio_samples_url, id_document_url, submitted_at
  - Updated status check to: SUBMITTED, UNDER_REVIEW, APPROVED, DECLINED, ACTIVE
  - Added indexes for status and email
- Updated `app/api/author-applications/route.ts`:
  - Now handles all new form fields
  - Validates required fields
  - Stores expertise as array
  - Stores file URLs
- Created `app/api/author-applications/upload/route.ts`:
  - Handles file uploads (CV, Portfolio, ID)
  - Validates file types and sizes
  - Uses Supabase storage bucket 'author-documents'
- Updated `app/author-apply/page.tsx`:
  - Uploads files before submitting application
  - Passes file URLs to API
- Created `migrations/create-author-documents-bucket.sql`:
  - Creates storage bucket for author documents
  - Note: RLS policies must be configured in Supabase dashboard (requires owner permissions)

### Commits Made

1. `59ab832` - feat: redesign author application page with minimal professional design
2. `40cc710` - feat: connect author application form to backend with all new fields
3. `5ac26d3` - fix: remove storage RLS policies from bucket migration

**Note:** The last push failed due to network issue. Retrying now.

---

## Pending Tasks

### Immediate (Author Application Workflow)

1. **Run Database Migrations**
   - Run `migrations/update-author-applications.sql` in Supabase
   - Run `migrations/create-author-documents-bucket.sql` in Supabase
   - Configure RLS policies for storage bucket in Supabase dashboard

2. **Test Form Submission**
   - Visit `/author-apply` while signed out
   - Confirm authentication flow works
   - Submit a test application with all fields
   - Verify database stores all fields correctly
   - Test file uploads

3. **Admin Workflow**
   - Ensure `/admin/authors/applications` displays new fields
   - Update admin review page to show all new fields
   - Implement status change actions (Under Review, Approve, Decline)

4. **Email Notifications**
   - Implement email notifications for status changes
   - Email on: Submitted, Under Review, Approved, Declined

5. **Approval Workflow**
   - On approval: Create `authors` profile record
   - Create/provision Clerk account
   - Send login details or activation email
   - Redirect author to `/author` portal
   - Enable password change in settings

---

## Known Issues

### Database Schema Mismatch
- Original schema: `expertise` (array), `portfolio_url`, `social_links`, `credentials`, `motivation`
- New form sends: `expertiseArea` (comma-separated string), `portfolioLink`, `linkedinProfile`, `bio`, `whyBecomeAuthor`
- API converts: `expertiseArea.split(', ')` → array, `whyBecomeAuthor` → `motivation`

### File Upload RLS
- Storage bucket RLS policies require owner permissions
- Must be configured manually in Supabase dashboard
- Current migration only creates the bucket

### Unauthenticated Applications
- Current API requires Clerk authentication (`userId`)
- Original requirement: "They should not sign in before applying"
- Need to decide on unauthenticated-to-Clerk account linking strategy:
  - Option A: Create Clerk account during application
  - Option B: Require sign-in at submission
  - Option C: Store pending email/token, link after verification

---

## Important Files

### Author Application
- `app/author-apply/page.tsx` - Main application form (582 lines)
- `app/api/author-applications/route.ts` - API endpoint
- `app/api/author-applications/upload/route.ts` - File upload API
- `migrations/update-author-applications.sql` - Schema update
- `migrations/create-author-documents-bucket.sql` - Storage bucket

### Admin
- `app/admin/authors/applications/page.tsx` - Application list
- `app/admin/authors/applications/[id]/page.tsx` - Application detail/review
- `components/admin/AdminSidebar.tsx` - Admin navigation

### Design System
- `lib/design-system.ts` - Design tokens
- `app/globals.css` - Global styles

### Navigation
- `components/MarketplaceNavigation.tsx` - Public navigation
- `components/student/StudentShell.tsx` - Student shell
- `components/author/AuthorShell.tsx` - Author shell

---

## Reference Assets

- Real logo: `C:\Users\ACER\Desktop\autolearn-spot\public\autolearn-brandmark.png`
- Reference image: `C:\Users\ACER\Desktop\author form.png`

---

## Phase 1 Requirements (from user)

### Design System
- Brand: primary palette, secondary palette, surfaces, text hierarchy, borders, gradients, shadows
- Typography: display, heading, body, metadata, numbers/statistics
- Components: Button, Card, Badge, Input, Select, Modal, Tabs, Avatar, Dropdown, Toast, Progress, EmptyState, Skeleton, PageHeader, StatCard, DataTable, Navigation

### Navigation
- Public: Logo, Explore, Skills, Courses, Authors, ALEX, Cart, Account
- Student: Home, My Learning, Achievements, Certificates, Leaderboard, Profile, ALEX
- Author: Overview, Products, Curriculum, Students, Reviews, Analytics, Earnings, Withdrawals, Profile, Settings
- Admin: Overview, Marketplace, Products, Authors, Students, Orders, Revenue, Withdrawals, Skills, Reviews, Certificates, Partnerships, AI, Design Studio

---

## Tech Stack

- Next.js 16.2.6 with App Router
- React
- TypeScript
- Tailwind CSS
- Clerk authentication
- Supabase (database + storage)
- Paystack payments
- Vercel deployment
- lucide-react icons
- clsx, tailwind-merge

---

## Commands

### Build
```powershell
cd "C:\Users\ACER\Desktop\autolearn-spot"
npm run build
```

### Git Status
```powershell
cd "C:\Users\ACER\Desktop\autolearn-spot"
git status
git log --oneline -5
```

### Push
```powershell
cd "C:\Users\ACER\Desktop\autolearn-spot"
git push
```

---

## Next Steps

1. Run database migrations in Supabase
2. Configure storage bucket RLS in Supabase dashboard
3. Test form submission with all fields
4. Implement email notifications
5. Implement approval workflow with author profile creation
6. Continue with Phase 1 design system implementation

---

## Notes

- Do NOT perform destructive rewrites
- Keep public, student, author, admin, and ALEX experiences separated
- Use design-system tokens for future Design Studio control
- Default background should be light ash/light gray
- Ensure strong contrast in forms
- Preserve existing backend/domain foundation
