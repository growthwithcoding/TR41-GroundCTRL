/**
 * Scenario Creator - Admin Tool
 * Multi-step wizard for creating training scenarios
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { createScenario, createScenarioStep, getSatellites, getGroundStations, getScenario, listScenarioSteps, updateScenario, updateScenarioStep } from '@/lib/api/scenarioService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Check, Loader2, Rocket } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const STEPS = ['Basic Info', 'Satellite & Ground Station', 'Steps & Objectives', 'Review & Publish']

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const TIERS = ['ROOKIE_PILOT', 'MISSION_SPECIALIST', 'MISSION_COMMANDER']
const TYPES = ['GUIDED', 'SANDBOX']
const STATUSES = ['DRAFT', 'PUBLISHED']

export default function ScenarioCreator() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const viewId = searchParams.get('view')
  const scenarioId = editId || viewId

  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [satellites, setSatellites] = useState([])
  const [groundStations, setGroundStations] = useState([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [isViewMode, setIsViewMode] = useState(false)

  // Form data
  const [scenarioData, setScenarioData] = useState({
    code: '',
    title: '',
    description: '',
    difficulty: 'BEGINNER',
    tier: 'ROOKIE_PILOT',
    type: 'GUIDED',
    estimatedDurationMinutes: 30,
    status: 'DRAFT',
    isActive: true,
    isCore: false,
    isPublic: false,
    satellite_id: '',
    ground_station_id: '',
    tags: [],
    objectives: [],
    prerequisites: []
  })

  const [steps, setSteps] = useState([
    {
      stepOrder: 1,
      title: '',
      instructions: '',
      objective: '',
      completionCondition: '',
      isCheckpoint: false,
      expectedDurationSeconds: 300,
      hint_suggestion: ''
    }
  ])

  // Load existing scenario for editing or viewing
  useEffect(() => {
    if (scenarioId) {
      loadExistingScenario(scenarioId)
    }
  }, [scenarioId])

  const loadExistingScenario = async (id) => {
    try {
      setLoading(true)
      
      // Load scenario data
      const scenarioResponse = await getScenario(id)
      const scenario = scenarioResponse?.data || scenarioResponse
      
      setScenarioData({
        code: scenario.code || '',
        title: scenario.title || '',
        description: scenario.description || '',
        difficulty: scenario.difficulty || 'BEGINNER',
        tier: scenario.tier || 'ROOKIE_PILOT',
        type: scenario.type || 'GUIDED',
        estimatedDurationMinutes: scenario.estimatedDurationMinutes || 30,
        status: scenario.status || 'DRAFT',
        isActive: scenario.isActive ?? true,
        isCore: scenario.isCore ?? false,
        isPublic: scenario.isPublic ?? false,
        satellite_id: scenario.satellite_id || '',
        ground_station_id: scenario.ground_station_id || '',
        tags: scenario.tags || [],
        objectives: scenario.objectives || [],
        prerequisites: scenario.prerequisites || []
      })
      
      // Load scenario steps
      const stepsResponse = await listScenarioSteps(id)
      const loadedSteps = stepsResponse?.data || stepsResponse
      
      if (Array.isArray(loadedSteps) && loadedSteps.length > 0) {
        setSteps(loadedSteps.map(step => ({
          id: step.id,
          stepOrder: step.stepOrder,
          title: step.title || '',
          instructions: step.instructions || '',
          objective: step.objective || '',
          completionCondition: step.completionCondition || '',
          isCheckpoint: step.isCheckpoint ?? false,
          expectedDurationSeconds: step.expectedDurationSeconds || 300,
          hint_suggestion: step.hint_suggestion || ''
        })))
      }
      
      setIsEditMode(!!editId)
      setIsViewMode(!!viewId)
      
      toast({
        title: viewId ? 'Viewing Scenario' : 'Loaded for Editing',
        description: `${viewId ? 'Viewing' : 'Editing'} scenario "${scenario.title}"`,
      })
    } catch (error) {
      console.error('Failed to load scenario:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load scenario',
        variant: 'destructive'
      })
      navigate('/admin/scenarios')
    } finally {
      setLoading(false)
    }
  }

  // Load satellites when on satellite step
  const loadSatellites = async () => {
    try {
      console.log('Loading satellites...')
      const response = await getSatellites()
      console.log('Satellites loaded:', response)
      
      // Handle paginated response structure: { data: [...], pagination: {...} }
      const satelliteList = response?.data || response
      setSatellites(Array.isArray(satelliteList) ? satelliteList : [])
    } catch (error) {
      console.error('Error loading satellites:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load satellites',
        variant: 'destructive'
      })
    }
  }
  // Load ground stations when on satellite step
  const loadGroundStations = async () => {
    try {
      console.log('Loading ground stations...')
      const response = await getGroundStations()
      console.log('Ground stations loaded:', response)
      
      // Handle different response structures
      const stationList = response?.data || response
      setGroundStations(Array.isArray(stationList) ? stationList : [])
    } catch (error) {
      console.error('Error loading ground stations:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load ground stations',
        variant: 'destructive'
      })
    }
  }
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      // Load satellites and ground stations when entering step 1
      if (nextStep === 1) {
        if (satellites.length === 0) loadSatellites()
        if (groundStations.length === 0) loadGroundStations()
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field, value) => {
    setScenarioData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean)
    setScenarioData(prev => ({ ...prev, [field]: items }))
  }

  const addStep = () => {
    setSteps(prev => [
      ...prev,
      {
        stepOrder: prev.length + 1,
        title: '',
        instructions: '',
        objective: '',
        completionCondition: '',
        isCheckpoint: false,
        expectedDurationSeconds: 300,
        hint_suggestion: ''
      }
    ])
  }

  const removeStep = (index) => {
    setSteps(prev => {
      const newSteps = prev.filter((_, i) => i !== index)
      // Renumber steps
      return newSteps.map((step, i) => ({ ...step, stepOrder: i + 1 }))
    })
  }

  const updateStep = (index, field, value) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    ))
  }

  const validateStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        if (!scenarioData.code || !scenarioData.title || !scenarioData.description) {
          toast({
            title: 'Required Fields',
            description: 'Please fill in code, title, and description',
            variant: 'destructive'
          })
          return false
        }
        if (!/^[A-Z0-9_]+$/.test(scenarioData.code)) {
          toast({
            title: 'Invalid Code',
            description: 'Code must be uppercase alphanumeric with underscores',
            variant: 'destructive'
          })
          return false
        }
        return true
      
      case 1: // Satellite
        if (!scenarioData.satellite_id) {
          toast({
            title: 'Satellite Required',
            description: 'Please select a satellite for this scenario',
            variant: 'destructive'
          })
          return false
        }
        return true
      
      case 2: // Steps
        const hasEmptySteps = steps.some(s => !s.title || !s.instructions || !s.objective)
        if (hasEmptySteps) {
          toast({
            title: 'Incomplete Steps',
            description: 'All steps must have title, instructions, and objective',
            variant: 'destructive'
          })
          return false
        }
        return true
      
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    setLoading(true)
    try {
      console.log('Current user:', user)
      console.log('Scenario data to submit:', scenarioData)
      
      let finalScenarioId
      
      if (isEditMode && editId) {
        // Update existing scenario
        await updateScenario(editId, scenarioData)
        finalScenarioId = editId
        
        // Update or create steps
        for (const step of steps) {
          const stepPayload = {
            ...step,
            scenario_id: finalScenarioId
          }
          delete stepPayload.id // Remove id from payload
          
          if (step.id) {
            // Update existing step
            console.log('Updating step:', step.id, stepPayload)
            await updateScenarioStep(step.id, stepPayload)
          } else {
            // Create new step
            console.log('Creating new step:', stepPayload)
            await createScenarioStep(stepPayload)
          }
        }
        
        toast({
          title: 'Updated!',
          description: `Scenario "${scenarioData.title}" updated successfully`,
        })
      } else {
        // Create scenario
        const createdScenario = await createScenario(scenarioData)
        console.log('Scenario created:', createdScenario)
        finalScenarioId = createdScenario.data?.id || createdScenario.id
        
        if (!finalScenarioId) {
          throw new Error('Failed to get scenario ID from response')
        }
        
        console.log('Using scenario ID:', finalScenarioId)

        // Create steps
        for (const step of steps) {
          const stepPayload = {
            ...step,
            scenario_id: finalScenarioId
          }
          console.log('Creating step:', stepPayload)
          await createScenarioStep(stepPayload)
        }

        toast({
          title: 'Success!',
          description: `Scenario "${scenarioData.title}" created successfully`,
        })
      }

      navigate('/admin/scenarios')
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create scenario',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/scenarios')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scenarios
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Rocket className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">
              {isViewMode ? 'View Scenario' : isEditMode ? 'Edit Scenario' : 'Create New Scenario'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {isViewMode ? 'Review scenario details' : isEditMode ? 'Update scenario information' : 'Build a training mission for satellite operators'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-background text-muted-foreground'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={`w-20 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep]}</CardTitle>
            <CardDescription>
              {currentStep === 0 && 'Enter basic scenario information'}
              {currentStep === 1 && 'Select the satellite for this mission'}
              {currentStep === 2 && 'Define mission steps and learning objectives'}
              {currentStep === 3 && 'Review and publish your scenario'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Step 0: Basic Info */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">Scenario Code *</Label>
                  <Input
                    id="code"
                    value={scenarioData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    placeholder="ROOKIE_ORBIT_101"
                    className="font-mono"
                    disabled={isViewMode}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Uppercase letters, numbers, and underscores only
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                  <Input
                    id="title"
                    value={scenarioData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Orbital Insertion Basics"
                    disabled={isViewMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
                  <Textarea
                    id="description"
                    value={scenarioData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Learn the fundamentals of orbital mechanics..."
                    rows={2}
                    className="w-full"
                    disabled={isViewMode}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-sm font-medium">Difficulty</Label>
                    <Select
                      value={scenarioData.difficulty}
                      onValueChange={(value) => handleInputChange('difficulty', value)}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map(diff => (
                          <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tier" className="text-sm font-medium">Pilot Tier</Label>
                    <Select
                      value={scenarioData.tier}
                      onValueChange={(value) => handleInputChange('tier', value)}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIERS.map(tier => (
                          <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                    <Select
                      value={scenarioData.type}
                      onValueChange={(value) => handleInputChange('type', value)}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={scenarioData.estimatedDurationMinutes}
                      onChange={(e) => handleInputChange('estimatedDurationMinutes', parseInt(e.target.value))}
                      min={5}
                      max={480}
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-sm font-medium">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={scenarioData.tags.join(', ')}
                    onChange={(e) => handleArrayInput('tags', e.target.value)}
                    placeholder="orbital-mechanics, power-management"
                    disabled={isViewMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectives" className="text-sm font-medium">Learning Objectives (comma-separated)</Label>
                  <Textarea
                    id="objectives"
                    value={scenarioData.objectives.join(', ')}
                    onChange={(e) => handleArrayInput('objectives', e.target.value)}
                    placeholder="Understand orbital velocity, Calculate delta-v requirements"
                    rows={2}
                    className="w-full"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            )}

            {/* Step 1: Satellite & Ground Station */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Satellite Selection */}
                <div className="space-y-2">
                  <Label htmlFor="satellite" className="text-sm font-medium">Select Satellite *</Label>
                  <Select
                    value={scenarioData.satellite_id}
                    onValueChange={(value) => handleInputChange('satellite_id', value)}
                    disabled={loading || isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading satellites..." : "Choose a satellite..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {satellites.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No satellites available</div>
                      ) : (
                        satellites.map(sat => (
                          <SelectItem key={sat.id} value={sat.id}>
                            {sat.name || sat.id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {satellites.length} satellite{satellites.length !== 1 ? 's' : ''} available
                  </p>
                </div>

                {/* Ground Station Selection */}
                <div className="space-y-2">
                  <Label htmlFor="ground_station" className="text-sm font-medium">Select Ground Station (Optional)</Label>
                  <Select
                    value={scenarioData.ground_station_id || 'none'}
                    onValueChange={(value) => handleInputChange('ground_station_id', value === 'none' ? '' : value)}
                    disabled={loading || isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading ground stations..." : "Choose a ground station..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No ground station</SelectItem>
                      {groundStations.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No ground stations available</div>
                      ) : (
                        groundStations.map(station => {
                          const displayName = station.name || station.code || 'Unknown Station';
                          const location = station.location || (station.latitude && station.longitude ? `${station.latitude.toFixed(2)}°, ${station.longitude.toFixed(2)}°` : 'Location N/A');
                          return (
                            <SelectItem key={station.id} value={station.id}>
                              {displayName} - {location}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {groundStations.length} ground station{groundStations.length !== 1 ? 's' : ''} available
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Note:</strong> Initial satellite state can be configured later.
                    The selected satellite's default parameters will be used as the starting point.
                    Ground station configuration is optional and can be used for communication scenarios.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Steps */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <Card key={index} className="border-2">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">Step {step.stepOrder}</CardTitle>
                        {steps.length > 1 && !isViewMode && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeStep(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Step Title *</Label>
                        <Input
                          value={step.title}
                          onChange={(e) => updateStep(index, 'title', e.target.value)}
                          placeholder="e.g., Check Current Attitude"
                          className="h-10"
                          disabled={isViewMode}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Instructions *</Label>
                        <Textarea
                          value={step.instructions}
                          onChange={(e) => updateStep(index, 'instructions', e.target.value)}
                          placeholder="Provide detailed instructions for this step..."
                          rows={4}
                          className="resize-none w-full"
                          disabled={isViewMode}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Success Criteria *</Label>
                        <Input
                          value={step.objective}
                          onChange={(e) => updateStep(index, 'objective', e.target.value)}
                          placeholder="e.g., Satellite orientation matches target within 2 degrees"
                          className="h-10"
                          disabled={isViewMode}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Hints for NOVA AI</Label>
                        <Textarea
                          value={step.hint_suggestion}
                          onChange={(e) => updateStep(index, 'hint_suggestion', e.target.value)}
                          placeholder="Hints to help NOVA guide the user..."
                          rows={3}
                          className="w-full resize-none"
                          disabled={isViewMode}
                        />
                      </div>

                      {/* Completion Condition */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Completion Condition <span className="text-red-500">*</span></Label>
                        <Textarea
                          value={step.completionCondition}
                          onChange={(e) => updateStep(index, 'completionCondition', e.target.value)}
                          placeholder="How the system knows this step is complete (e.g., 'User successfully sends TLE command')..."
                          rows={2}
                          className="w-full resize-none"
                          required
                          disabled={isViewMode}
                        />
                      </div>

                      {/* Duration & Checkpoint */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Duration (seconds) <span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            value={step.expectedDurationSeconds}
                            onChange={(e) => updateStep(index, 'expectedDurationSeconds', parseInt(e.target.value) || 300)}
                            min={1}
                            required
                            disabled={isViewMode}
                          />
                        </div>
                        <div className="space-y-2 flex items-center">
                          <input
                            type="checkbox"
                            id={`checkpoint-${index}`}
                            checked={step.isCheckpoint}
                            onChange={(e) => updateStep(index, 'isCheckpoint', e.target.checked)}
                            className="mr-2"
                            disabled={isViewMode}
                          />
                          <Label htmlFor={`checkpoint-${index}`} className="text-sm font-semibold cursor-pointer">Checkpoint (key milestone)</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {!isViewMode && (
                  <Button onClick={addStep} variant="outline" className="w-full h-11">
                    Add Step
                  </Button>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Scenario Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex py-1"><dt className="font-medium w-40 text-muted-foreground">Code:</dt><dd className="font-mono">{scenarioData.code}</dd></div>
                    <div className="flex py-1"><dt className="font-medium w-40 text-muted-foreground">Title:</dt><dd>{scenarioData.title}</dd></div>
                    <div className="flex py-1"><dt className="font-medium w-40 text-muted-foreground">Difficulty:</dt><dd>{scenarioData.difficulty}</dd></div>
                    <div className="flex py-1"><dt className="font-medium w-40 text-muted-foreground">Tier:</dt><dd>{scenarioData.tier}</dd></div>
                    <div className="flex py-1"><dt className="font-medium w-40 text-muted-foreground">Type:</dt><dd>{scenarioData.type}</dd></div>
                    <div className="flex py-1"><dt className="font-medium w-40 text-muted-foreground">Duration:</dt><dd>{scenarioData.estimatedDurationMinutes} minutes</dd></div>
                    <div className="flex py-1"><dt className="font-medium w-40 text-muted-foreground">Steps:</dt><dd>{steps.length}</dd></div>
                  </dl>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">Publishing Status</Label>
                  <Select
                    value={scenarioData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scenarioData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="h-4 w-4"
                      disabled={isViewMode}
                    />
                    <span className="text-sm">Active (visible to users)</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scenarioData.isCore}
                      onChange={(e) => handleInputChange('isCore', e.target.checked)}
                      className="h-4 w-4"
                      disabled={isViewMode}
                    />
                    <span className="text-sm">Core Training (required for tier advancement)</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scenarioData.isPublic}
                      onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                      className="h-4 w-4"
                      disabled={isViewMode}
                    />
                    <span className="text-sm">Public (all users can access)</span>
                  </label>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm leading-relaxed">
                    <strong className="font-semibold">Ready to create?</strong> This scenario will be {scenarioData.status === 'DRAFT' ? 'saved as a draft' : 'published and available to users'}.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={() => validateStep() && handleNext()} disabled={loading}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            !isViewMode && (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Scenario' : 'Create Scenario'}
                  </>
                )}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
