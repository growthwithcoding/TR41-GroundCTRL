/**
 * Admin Scenarios List
 * Placeholder page for viewing all scenarios (admin view)
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Plus, Rocket } from 'lucide-react'

export default function AdminScenarios() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Rocket className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Scenario Management</h1>
            </div>
            <p className="text-muted-foreground">
              Create and manage training scenarios
            </p>
          </div>
          
          <Button onClick={() => navigate('/admin/scenarios/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Scenario
          </Button>
        </div>

        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Scenario list view coming soon...
          </p>
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/scenarios/create')}
          >
            Create Your First Scenario
          </Button>
        </div>
      </div>
    </div>
  )
}
