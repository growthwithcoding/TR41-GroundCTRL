/**
 * Scenario List - Admin Tool
 * View and manage all training scenarios
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listScenarios, deleteScenario, updateScenario } from '@/lib/api/scenarioService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, Search, Eye, Pencil, Trash2, Rocket, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminScenarios() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')

  useEffect(() => {
    loadScenarios()
  }, [])

  const loadScenarios = async () => {
    try {
      setLoading(true)
      const response = await listScenarios()
      const scenarioList = response?.data || response
      setScenarios(Array.isArray(scenarioList) ? scenarioList : [])
    } catch (error) {
      console.error('Failed to load scenarios:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load scenarios',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (scenarioId, scenarioTitle) => {
    if (!confirm(`Are you sure you want to delete "${scenarioTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteScenario(scenarioId)
      toast({
        title: 'Deleted',
        description: `Scenario "${scenarioTitle}" has been deleted`,
      })
      loadScenarios()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete scenario',
        variant: 'destructive'
      })
    }
  }

  const handleToggleStatus = async (scenario) => {
    const newStatus = scenario.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    
    try {
      await updateScenario(scenario.id, { status: newStatus })
      toast({
        title: 'Updated',
        description: `Scenario status changed to ${newStatus}`,
      })
      loadScenarios()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update scenario',
        variant: 'destructive'
      })
    }
  }

  // Filter scenarios
  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = scenario.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scenario.code?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || scenario.status === filterStatus
    const matchesDifficulty = filterDifficulty === 'all' || scenario.difficulty === filterDifficulty
    
    return matchesSearch && matchesStatus && matchesDifficulty
  })

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'ADVANCED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    return status === 'PUBLISHED' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <Rocket className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading scenarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Training Scenarios</h1>
              </div>
              <p className="text-muted-foreground">
                Manage and organize training missions for satellite operators
              </p>
            </div>
            <Button onClick={() => navigate('/admin/scenario-creator')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Scenario
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scenarios List */}
        {filteredScenarios.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scenarios found</h3>
              <p className="text-muted-foreground mb-4">
                {scenarios.length === 0 
                  ? "Get started by creating your first training scenario"
                  : "Try adjusting your search filters"}
              </p>
              {scenarios.length === 0 && (
                <Button onClick={() => navigate('/admin/scenario-creator')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Your First Scenario
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredScenarios.map((scenario) => (
              <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {scenario.code}
                        </code>
                        <Badge className={getStatusColor(scenario.status)}>
                          {scenario.status}
                        </Badge>
                        <Badge className={getDifficultyColor(scenario.difficulty)}>
                          {scenario.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{scenario.title}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {scenario.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Tier:</span> {scenario.tier}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {scenario.type}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {scenario.estimatedDurationMinutes}m
                      </div>
                      {scenario.isCore && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Core Training
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(scenario)}
                      >
                        {scenario.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/scenario-creator?view=${scenario.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/scenario-creator?edit=${scenario.id}`)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(scenario.id, scenario.title)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {scenarios.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {filteredScenarios.length} of {scenarios.length} scenarios
          </div>
        )}
      </div>
    </div>
  )
}
