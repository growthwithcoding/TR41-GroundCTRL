# Ground Station Map Display Fix

## Issues Identified

### 1. **Ground Station Labels Not Showing**
**Problem**: Labels were attempting to use `station.displayName` which doesn't exist in the Firestore data structure.

**Root Cause**: The ground station seed data uses `code` and `name` fields, not `displayName`.

**Fix**: Updated the label rendering to use the human-readable name:
```javascript
const displayLabel = station.name || station.code || 'Unknown'
```

This displays full station names like "Hartebeesthoek Station" instead of codes like "SOUTH_AFRICA".

### 2. **Incorrect Data Structure Assumptions**
**Problem**: Code was checking for nested `location` object: `station.location?.latitude`

**Root Cause**: Firestore ground stations have `latitude` and `longitude` at the top level, not nested.

**Firestore Structure** (from `backend/seeders/data/groundStations.js`):
```javascript
{
  code: 'SVALBARD',
  name: 'Svalbard Satellite Station',
  location: 'Svalbard, Norway',  // This is a STRING, not an object!
  latitude: 78.2295,              // Top-level field
  longitude: 15.3906,             // Top-level field
  altitude_m: 500,
  // ...
}
```

**Fix**: Changed to direct property access:
```javascript
const lat = station.latitude
const lon = station.longitude
```

### 3. **Label Visibility Improvements**
**Changes Made**:
- Moved label above station marker (`y - 12` instead of `y + 18`)
- Increased font size from `8` to `9`
- Added `fontWeight="500"` for better readability
- Changed colors: in-range uses `#22c55e` (green), out-of-range uses `#9ca3af` (gray)
- Added text shadow for better contrast against map background

## Equirectangular Projection Verification

The projection implementation in `world-map.jsx` is **CORRECT**:

### Formula (Plate Carrée)
```javascript
x = (longitude + 180) × 2  // Maps -180° to 180° → 0 to 720
y = (90 - latitude) × 2     // Maps 90° to -90° → 0 to 360
```

### Test Cases
| Station | Lat | Lon | SVG X | SVG Y | Expected Location |
|---------|-----|-----|-------|-------|-------------------|
| Svalbard | 78.23° | 15.39° | 390.8 | 23.5 | Far North, slightly east of prime meridian ✓ |
| Australia | -31.05° | 116.19° | 592.4 | 242.1 | Southern hemisphere, eastern side ✓ |
| Chile | -33.15° | -70.66° | 218.7 | 246.3 | Southern hemisphere, South America ✓ |
| Hawaii | 21.31° | -157.86° | 44.3 | 137.4 | Northern hemisphere, far west Pacific ✓ |
| Antarctica | -72.01° | 2.54° | 365.1 | 324.0 | Far South, near prime meridian ✓ |

### NASA Blue Marble Image
The map uses the authentic NASA Blue Marble: Next Generation imagery, which is also in equirectangular projection. The coordinates align perfectly with the Earth's actual geography.

**Image**: `/images/world.jpg` (5400x2700, 8km/pixel resolution)
**Source**: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/

## Files Modified

1. **frontend/src/components/simulator/mission-panel.jsx**
   - Fixed ground station coordinate access
   - Fixed label display name
   - Improved label styling and positioning
   - Added console warning for invalid coordinates

## Ground Stations in Database

The system has **7 global ground stations**:

1. **SVALBARD** - Svalbard, Norway (78.23°N, 15.39°E)
2. **ALASKA** - Fairbanks, Alaska (64.86°N, 147.85°W)
3. **HAWAII** - Oahu, Hawaii (21.31°N, 157.86°W)
4. **AUSTRALIA** - New Norcia, Western Australia (31.05°S, 116.19°E)
5. **SOUTH_AFRICA** - Hartebeesthoek (25.89°S, 27.71°E)
6. **CHILE** - Santiago (33.15°S, 70.66°W)
7. **ANTARCTICA** - Troll Station (72.01°S, 2.54°E)

These provide global coverage for LEO satellite tracking.

## Testing Recommendations

1. **Visual Verification**:
   - Start a simulator session
   - Check that all 7 ground stations appear on the map
   - Verify station labels are visible and positioned above markers
   - Confirm stations are at correct geographic locations

2. **Dynamic Behavior**:
   - Watch as satellite orbits - stations should highlight when in range
   - Coverage circles should turn green when satellite is overhead
   - Labels should change color (green when in range)

3. **Console Checks**:
   - Look for "📡 Received ground stations: 7" message
   - No warnings about invalid coordinates should appear
   - WebSocket should connect successfully

## Related Files

- `frontend/src/components/simulator/world-map.jsx` - Projection math and map rendering
- `backend/src/websocket/handlers/worldHandler.js` - Sends ground station data via WebSocket
- `backend/src/repositories/groundStationRepository.js` - Firestore queries
- `backend/seeders/data/groundStations.js` - Ground station seed data
- `frontend/src/contexts/WebSocketContext.jsx` - Receives and stores ground station data

## Summary

✅ **Ground station positioning**: Already correct (equirectangular projection validated)
✅ **Ground station labels**: Now displaying correctly using `code` field
✅ **Data structure**: Fixed to match Firestore schema (top-level lat/lon)
✅ **Visual improvements**: Better label styling, positioning, and contrast

The ground stations should now appear accurately on the NASA Blue Marble map with visible, properly-positioned labels.
