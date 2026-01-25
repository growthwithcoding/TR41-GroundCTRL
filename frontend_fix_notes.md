# Frontend Fix Notes

## Launch Animation Issues

### Satellite Altitude Mismatch
- **Issue**: The launch animation currently uses hardcoded altitude values instead of actual satellite data from scenarioSession
- **Fix Required**: Update the animation to pull actual altitude from scenarioSession data
- **Dependencies**: May require WebSocket connection to get real-time satellite data

### Subsystem Status Indicators
- **Issue**: POWER, COMMS, ATTITUDE, PAYLOAD status lights may not match the actual scenario structure
- **Fix Required**: Verify that status lights accurately reflect the scenario's subsystem states
- **Location**: Check simulator components for subsystem status rendering
- **Dependencies**: Ensure data structure matches between scenario definition and UI components

## Next Steps
- Implement WebSocket connection for real-time data updates
- Once WebSocket is operational, verify data flow from scenarioSession to launch animation
- Test subsystem status indicators against various scenario configurations
