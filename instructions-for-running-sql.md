# Instructions for Running SQL Scripts in Supabase

## Running the SQL Script

1. **Log in to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - This will open the SQL query interface

3. **Run the SQL Script**
   - Copy the contents of `fix-partner-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

4. **Verify the Results**
   - Check that all tables were created successfully
   - Verify that all columns were added
   - Ensure no errors occurred

## Run Verification Script

After running the main script, also run `verify-schema.sql` to check:

1. **Check if tables exist** with correct columns
2. **Check if columns were added** to partners table
3. **Check current data** in the tables
4. **Identify any missing** schema elements

## Check Vercel Logs for Errors

To see the real production errors:

1. **Go to Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your project (autolearn-spot)

2. **View Function Logs**
   - Click on "Functions" in the left sidebar
   - Look for recent function invocations
   - Check the logs for:
     - `/api/admin/partners` - Partner creation errors
     - `/api/admin/marketing/upload` - Marketing upload errors
     - `/api/admin/marketing/materials` - Marketing materials fetch errors

3. **Look for specific error messages**
   - The enhanced logging will show:
     - Database error codes
     - Error messages and hints
     - Detailed error information
     - Request/response flow

## What This Script Does

The `fix-partner-schema.sql` script will:

1. **Create Marketing Downloads Table**
   - `partner_marketing_downloads` - Stores marketing material metadata

2. **Add Partner ID Column**
   - Adds `partner_id` column to the `partners` table

3. **Create Bank Profiles Table**
   - `partner_bank_profiles` - Stores partner bank details

4. **Create Referrals Table**
   - `partner_referrals` - Tracks referral codes and clicks

5. **Add Partner Statistics Columns**
   - `total_clicks` - Number of referral link clicks
   - `total_registrations` - Number of successful registrations
   - `available_earnings` - Available for withdrawal
   - `pending_earnings` - In holding period

6. **Create Commissions Table**
   - `commissions` - Tracks referral commissions

7. **Add Performance Indexes**
   - Improves query performance

8. **Enable Row Level Security**
   - Sets up proper security policies

## Troubleshooting

If you encounter any errors:

1. **Column Already Exists**
   - The script uses `IF NOT EXISTS` to avoid duplicate columns
   - This error can be safely ignored

2. **Permission Denied**
   - Ensure you have admin access to the Supabase project
   - The script grants permissions at the end

3. **Table Already Exists**
   - The script uses `CREATE TABLE IF NOT EXISTS`
   - This error can be safely ignored

## After Running the Script

Once the script runs successfully:

1. **Marketing Upload** - Should work without errors
2. **Partner Creation** - Should work with partner_id column
3. **Partner Details** - Should show bank details when available
4. **Referral Tracking** - Should work with partner_referrals table
5. **Commission Tracking** - Should work with commissions table

## Testing

After running the script, test:

1. Upload a marketing material
2. Create a new partner manually
3. Click on a partner to see their details
4. Check if bank details show (if partner has added them)
5. Verify theme customization persists across sessions

## Debug Production Issues

If issues persist after deployment:

1. **Check Vercel Logs** - Look for specific error messages
2. **Run Verification Script** - Ensure database schema is correct
3. **Check Browser Console** - Look for client-side errors
4. **Test APIs Locally** - Use curl or Postman to test endpoints directly