# Database Documentation

## Cohort Management System

### Overview
The cohort management system supports unlimited cohorts with proper lifecycle management using the existing database schema.

### Cohorts Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Cohort name |
| slug | VARCHAR(255) | URL-friendly cohort identifier |
| price_ngn | DECIMAL(10,2) | Registration fee in Naira |
| status | VARCHAR(50) | Status: draft, upcoming, active, completed, archived |
| start_date | TIMESTAMP WITH TIME ZONE | Cohort start date |
| end_date | TIMESTAMP WITH TIME ZONE | Cohort end date |
| is_current | BOOLEAN | Whether this is the currently active cohort (unique index) |
| timezone | VARCHAR(50) | Timezone for cohort scheduling |
| settings | JSONB | Cohort configuration (schedule, certificate rules, etc.) |
| created_at | TIMESTAMP WITH TIME ZONE | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | Last update timestamp |

### Indexes
- Unique index on `is_current` ensuring only one cohort can be current
- Index on `status` for filtering by status
- Index on `slug` for URL lookups

### Row Level Security Policies

#### Admin Policies
- **Admins can view all cohorts** - Full read access for admins
- **Admins can create cohorts** - Create new cohorts
- **Admins can update cohorts** - Update cohort details
- **Admins can delete cohorts** - Delete cohorts

#### Student Policies
- **Students can view active cohorts** - Read-only access to active cohorts (status = 'active' OR is_current = true)

### Helper Functions

Located in `lib/cohort.ts`:

- `getActiveCohort()` - Get the currently active cohort (status = 'active' AND is_current = true)
- `getCohortById(id)` - Get a specific cohort by ID
- `getAllCohorts()` - Get all cohorts (admin only)
- `createCohort(cohort)` - Create a new cohort (admin only)
- `updateCohort(id, updates)` - Update a cohort (admin only)
- `archiveCohort(id)` - Archive a cohort (admin only)
- `activateCohort(id)` - Activate a cohort (admin only)
- `getUpcomingCohorts()` - Get upcoming cohorts

### TypeScript Types

Located in `types/cohort.ts`:

- `Cohort` - Main cohort interface matching database schema
- `CohortStatus` - Union type for cohort status
- `CohortSettings` - Configuration for cohort schedule and certificate rules

### Cohort Lifecycle

1. **draft** - Initial state, not visible to students
2. **upcoming** - Published but not yet started
3. **active** - Currently running cohort (is_current = true)
4. **completed** - Cohort has ended
5. **archived** - Hidden from view

### Active Cohort Determination

The active cohort is determined by both:
- `status = 'active'` 
- `is_current = true`

This dual condition ensures proper cohort lifecycle management.
