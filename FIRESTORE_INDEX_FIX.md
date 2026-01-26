# Firestore Index Fix for Missions Query

## Problem
The Missions page was failing to load scenarios from Firestore with the error:
```
The query requires an index
```

## Root Cause
The query in `frontend/src/lib/firebase/scenariosService.js` (`fetchPublishedScenarios()`) uses multiple filters and ordering:
- `where('status', '==', 'PUBLISHED')`
- `where('isActive', '==', true)`
- `orderBy('tier')`
- `orderBy('estimatedDurationMinutes')`

Firestore requires a composite index for queries with multiple where clauses and orderBy operations.

## Solution
Added a composite index to `firestore.indexes.json` with the following fields in order:
1. `isActive` (ASCENDING)
2. `status` (ASCENDING)
3. `tier` (ASCENDING)
4. `estimatedDurationMinutes` (ASCENDING)

## Deployment
The index was deployed using:
```bash
firebase deploy --only firestore:indexes --project groundctrl-c8860
```

## Index Build Time
⏱️ **Important**: Firestore composite indexes need time to build, especially with existing data. This can take:
- A few minutes for small datasets (< 1000 documents)
- 10-30 minutes for medium datasets (1000-10000 documents)
- Longer for larger datasets

## Verification Steps

### 1. Check Index Status
Visit the Firebase Console to check if the index has finished building:
https://console.firebase.google.com/project/groundctrl-c8860/firestore/indexes

The index status should show:
- 🔄 **Building** - Index is currently being created
- ✅ **Enabled** - Index is ready to use

### 2. Test the Missions Page
Once the index status shows "Enabled":
1. Navigate to the Missions page in your application
2. The error should be gone
3. Real scenario data from Firestore should load successfully

### 3. Monitor Console
Check the browser console for:
- ✅ No "requires an index" errors
- ✅ Scenarios loading successfully
- ✅ No "using mock data" fallback messages

## Additional Notes

- The deployment message indicated there are 32 other indexes in the Firebase project not tracked in `firestore.indexes.json`
- These can be added to the file later if needed by running:
  ```bash
  firebase firestore:indexes > firestore.indexes.json
  ```
- The current index configuration focuses on the immediate need for the missions query

## Files Modified
- `firestore.indexes.json` - Added composite index for scenarios collection

## Related Files
- `frontend/src/lib/firebase/scenariosService.js` - Contains the query requiring the index
- `frontend/src/pages/Missions.jsx` - Page that displays missions using the query
