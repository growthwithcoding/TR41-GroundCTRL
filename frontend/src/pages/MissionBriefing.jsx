import { useParams, useNavigate } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play } from "lucide-react"

export default function MissionBriefingPage() {
  const { missionId } = useParams()
  const navigate = useNavigate()
  
  const handleStartMission = () => {
    navigate(`/simulator?mission=${missionId}`)
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/missions')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Missions
          </Button>
          
          <div className="bg-card border border-border rounded-lg p-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Mission Briefing
            </h1>
            <p className="text-muted-foreground mb-6">
              Mission ID: {missionId}
            </p>
            
            <div className="space-y-4 mb-8">
              <p className="text-foreground">
                This page is under construction. Mission briefings will provide detailed
                information about mission objectives, procedures, and success criteria.
              </p>
            </div>
            
            <Button onClick={handleStartMission} className="w-full sm:w-auto">
              <Play className="w-4 h-4 mr-2" />
              Start Mission
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
