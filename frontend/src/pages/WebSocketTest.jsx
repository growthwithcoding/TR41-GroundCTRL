/**
 * WebSocket Test Page
 * Demo page to test Socket.IO real-time communication
 */

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, Radio, Send, Loader2 } from 'lucide-react';

export default function WebSocketTest() {
  const {
    connected,
    sessionState,
    currentSessionId,
    joinSession,
    leaveSession,
    sendCommand,
    requestState
  } = useWebSocket();

  const [testSessionId, setTestSessionId] = useState('test-session-123');
  const [commandHistory, setCommandHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Listen for command status updates
  useEffect(() => {
    const handleCommandStatus = (event) => {
      const status = event.detail;
      setCommandHistory(prev => [...prev, {
        ...status,
        timestamp: new Date(status.timestamp).toLocaleTimeString()
      }]);
    };

    window.addEventListener('command:status', handleCommandStatus);
    return () => window.removeEventListener('command:status', handleCommandStatus);
  }, []);

  // Track state updates
  useEffect(() => {
    if (sessionState) {
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [sessionState]);

  const handleJoinSession = () => {
    joinSession(testSessionId);
  };

  const handleLeaveSession = () => {
    leaveSession(testSessionId);
  };

  const handleSendTestCommand = () => {
    sendCommand(testSessionId, {
      id: `cmd-${Date.now()}`,
      type: 'test',
      name: 'Test Command'
    }, {
      testParam: 'Hello from WebSocket!'
    });
  };

  const handleRequestState = () => {
    requestState(testSessionId);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WebSocket Test Console</h1>
          <p className="text-muted-foreground">Test Socket.IO real-time communication</p>
        </div>
        <Badge variant={connected ? 'default' : 'destructive'} className="h-8 px-4">
          {connected ? (
            <>
              <Wifi className="mr-2 h-4 w-4" />
              Connected
            </>
          ) : (
            <>
              <WifiOff className="mr-2 h-4 w-4" />
              Disconnected
            </>
          )}
        </Badge>
      </div>

      {/* Connection Status */}
      <Alert>
        <Radio className="h-4 w-4" />
        <AlertDescription>
          {connected ? (
            <span className="text-green-600 font-semibold">
              ✅ WebSocket connection established successfully
            </span>
          ) : (
            <span className="text-red-600 font-semibold">
              ❌ WebSocket not connected. Make sure the backend server is running.
            </span>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Session Control</CardTitle>
            <CardDescription>Join or leave a telemetry session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Session ID</label>
              <input
                type="text"
                value={testSessionId}
                onChange={(e) => setTestSessionId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Enter session ID"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleJoinSession} 
                disabled={!connected || currentSessionId}
                className="flex-1"
              >
                Join Session
              </Button>
              <Button 
                onClick={handleLeaveSession} 
                disabled={!connected || !currentSessionId}
                variant="outline"
                className="flex-1"
              >
                Leave Session
              </Button>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Current Session: <span className="font-mono">{currentSessionId || 'None'}</span>
              </p>
              {lastUpdate && (
                <p className="text-sm text-muted-foreground">
                  Last Update: {lastUpdate}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Command Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Command Testing</CardTitle>
            <CardDescription>Send test commands and track status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSendTestCommand} 
              disabled={!connected || !currentSessionId}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Test Command
            </Button>

            <Button 
              onClick={handleRequestState} 
              disabled={!connected || !currentSessionId}
              variant="outline"
              className="w-full"
            >
              Request Current State
            </Button>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">Command History:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {commandHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No commands sent yet</p>
                ) : (
                  commandHistory.slice(-5).reverse().map((cmd, idx) => (
                    <div key={idx} className="text-xs font-mono bg-muted p-2 rounded">
                      {cmd.timestamp} - {cmd.commandId} - {cmd.status}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telemetry Data */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Real-Time Telemetry Data</CardTitle>
            <CardDescription>Live data from simulation engine</CardDescription>
          </CardHeader>
          <CardContent>
            {!sessionState ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Join a session to see real-time telemetry data</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Orbit Data */}
                {sessionState.telemetry?.orbit && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Orbit</h3>
                    <div className="space-y-1 text-sm">
                      <p>Altitude: {sessionState.telemetry.orbit.altitude_km?.toFixed(2)} km</p>
                      <p>Inclination: {sessionState.telemetry.orbit.inclination_degrees?.toFixed(1)}°</p>
                      <p>Longitude: {sessionState.telemetry.orbit.longitude?.toFixed(2)}°</p>
                      <p>Latitude: {sessionState.telemetry.orbit.latitude?.toFixed(2)}°</p>
                    </div>
                  </div>
                )}

                {/* Power Data */}
                {sessionState.telemetry?.power && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Power</h3>
                    <div className="space-y-1 text-sm">
                      <p>Battery: {sessionState.telemetry.power.currentCharge_percent?.toFixed(1)}%</p>
                      <p>Solar: {sessionState.telemetry.power.solarPower_watts} W</p>
                      <p>Consumption: {sessionState.telemetry.power.consumption_watts} W</p>
                      <Badge variant={
                        sessionState.telemetry.power.status === 'nominal' ? 'default' :
                        sessionState.telemetry.power.status === 'warning' ? 'warning' : 'destructive'
                      }>
                        {sessionState.telemetry.power.status}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Attitude Data */}
                {sessionState.telemetry?.attitude && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Attitude</h3>
                    <div className="space-y-1 text-sm">
                      <p>Roll: {sessionState.telemetry.attitude.roll_degrees?.toFixed(2)}°</p>
                      <p>Pitch: {sessionState.telemetry.attitude.pitch_degrees?.toFixed(2)}°</p>
                      <p>Yaw: {sessionState.telemetry.attitude.yaw_degrees?.toFixed(2)}°</p>
                      <Badge variant="default">{sessionState.telemetry.attitude.status}</Badge>
                    </div>
                  </div>
                )}

                {/* Thermal Data */}
                {sessionState.telemetry?.thermal && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Thermal</h3>
                    <div className="space-y-1 text-sm">
                      <p>Temp: {sessionState.telemetry.thermal.temperature_celsius?.toFixed(1)}°C</p>
                      <Badge variant="default">{sessionState.telemetry.thermal.status}</Badge>
                    </div>
                  </div>
                )}

                {/* Propulsion Data */}
                {sessionState.telemetry?.propulsion && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Propulsion</h3>
                    <div className="space-y-1 text-sm">
                      <p>Fuel: {sessionState.telemetry.propulsion.fuel_percent?.toFixed(1)}%</p>
                      <Badge variant="default">{sessionState.telemetry.propulsion.status}</Badge>
                    </div>
                  </div>
                )}

                {/* Payload Data */}
                {sessionState.telemetry?.payload && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Payload</h3>
                    <div className="space-y-1 text-sm">
                      <p>Data: {sessionState.telemetry.payload.dataCollected_mb?.toFixed(2)} MB</p>
                      <Badge variant="default">{sessionState.telemetry.payload.status}</Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {sessionState && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Elapsed Time: {sessionState.elapsedTime?.toFixed(1)}s | 
                  Last Update: {new Date(sessionState.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-1">
            <li>Ensure the backend server is running: <code className="bg-muted px-1 rounded">cd backend && npm run dev</code></li>
            <li>Check that the "Connected" badge is green at the top</li>
            <li>Click "Join Session" to connect to the test session</li>
            <li>Watch the telemetry data update every 2 seconds</li>
            <li>Click "Send Test Command" to test command transmission</li>
            <li>Watch the command history for status updates</li>
            <li>Click "Leave Session" when done</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
