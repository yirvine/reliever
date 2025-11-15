# Clear Corrupted Case Data

The database has accumulated multiple conflicting versions of case data from the race condition bugs we've been fixing.

## Option 1: Clear via Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run this query:

```sql
-- Clear all case data for your vessels
DELETE FROM vessel_cases WHERE user_id = 'YOUR_USER_ID';
```

Replace `'YOUR_USER_ID'` with your actual Firebase user ID.

## Option 2: Clear via the App

1. For each vessel:
   - Go to the vessel
   - Make sure external-fire is NOT selected
   - Click "Save"
   - This will overwrite the DB with clean data

## Option 3: Nuclear Option (if nothing else works)

Delete your test vessels and create new ones. The corruption is in the saved case data.

## After Clearing

1. Create/select a vessel
2. Select external-fire case
3. Go to external-fire page
4. Enter parameters
5. Let it calculate
6. Switch to another vessel
7. Switch back
8. **Verify the flow value is stable** (should stay the same value)

---

**Why this happened:**

The race conditions we've been fixing allowed the database to accumulate multiple conflicting saves. Now that the race conditions are fixed, we need to clear the old corrupted data.

