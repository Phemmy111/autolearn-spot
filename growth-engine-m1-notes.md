# Growth Engine Milestone 1 Notes

## Lifecycle mapping:
- **clicked**    → `referral_clicks` row exists
- **applied**    → `scholarship_applications.referred_by_code` is set
- **approved**   → `scholarship_applications.status = 'Accepted'`
- **paid**       → `scholarship_applications.payment_status = 'Verified'`
- **commission_created** → future: `commissions` table (Milestone 3)
- **available**  → future: `commissions.status = 'available'` (Milestone 3)
- **withdrawn**  → future: `commissions.status = 'withdrawn'` (Milestone 4)
