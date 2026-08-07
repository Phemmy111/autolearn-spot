# Database Documentation

## Cohort Management System

### Overview
The cohort management system supports unlimited cohorts with proper lifecycle management.

### Deployment Instructions

The SQL migration files must be run manually on your Supabase database:

1. **Run the table creation migration:**
   - Open Supabase Dashboard → SQL Editor
   - Copy and execute: `migrations/cohort-management/001_create_cohorts_table.sql`

2. **Run the RLS policies migration:**
   - In the same SQL Editor
   - Copy and execute: `migrations/cohort-management/002_create_cohorts_rls.sql`

### Cohorts Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Cohort name |
| description | TEXT | Cohort description |
| status | VARCHAR(50) | Status: draft, upcoming, active, completed, archived |
| registration_fee | DECIMAL(10,2) | Registration fee amount |
| max_students | INTEGER | Maximum student capacity |
| current_students | INTEGER | Current enrolled students |
| registration_open | BOOLEAN | Whether registration is open |
| registration_start | TIMESTAMP WITH TIME ZONE | Registration start date |
| registration_end | TIMESTAMP WITH TIME ZONE | Registration end date |
| cohort_start | TIMESTAMP WITH TIME ZONE | Cohort start date |
| cohort_end | TIMESTAMP WITH TIME ZONE | Cohort end date |
| is_active | BOOLEAN | Whether this is the currently active cohort |
| created_at | TIMESTAMP WITH TIME ZONE | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | Last update timestamp |
| created_by | VARCHAR(255) | Clerk user ID of creator |

### Indexes
- `idx_cohorts_status` - For filtering by status
- `idx_cohorts_is_active` - For finding active cohort
- `idx_cohorts_registration_dates` - For registration period queries
- `idx_cohorts_cohort_dates` - For cohort period queries

### Row Level Security Policies

#### Admin Policies
- **Admins can view all cohorts** - Full read access for admins
- **Admins can create cohorts** - Create new cohorts
- **Admins can update cohorts** - Update cohort details
- **Admins can delete cohorts** - Delete cohorts

#### Student Policies
- **Students can view active cohorts** - Read-only access to active cohorts

### Helper Functions

Located in `lib/cohort.ts`:

- `getActiveCohort()` - Get the currently active cohort
- `getCohortById(id)` - Get a specific cohort by ID
- `getAllCohorts()` - Get all cohorts (admin only)
- `createCohort(cohort)` - Create a new cohort (admin only)
- `updateCohort(id, updates)` - Update a cohort (admin only)
- `archiveCohort(id)` - Archive a cohort (admin only)
- `activateCohort(id)` - Activate a cohort (admin only)
- `getUpcomingCohorts()` - Get upcoming cohorts
- `updateCohortStudentCount(id, count)` - Update student count (admin only)

### TypeScript Types

Located in `types/cohort.ts`:

- `Cohort` - Main cohort interface matching database schema
- `CohortStatus` - Union type for cohort status
- `LegacyCohort` - Deprecated legacy type for backward compatibility

### Migration Files

- `migrations/cohort-management/001_create_cohorts_table.sql` - Creates cohorts table and indexes
- `migrations/cohort-management/002_create_cohorts_rls.sql` - Creates RLS policies

### Cohort Lifecycle

1. **draft** - Initial state, not visible to students
2. **upcoming** - Published but not yet started
3. **active** - Currently running cohort
4. **completed** - Cohort has ended
5. **archived** - Hidden from view

### Data Seeding

The migration automatically inserts "Cohort 1" as the initial active cohort to maintain compatibility with existing data.
