/**
 * Certificate Modal Component
 * 
 * Mission Control Enhancement - Phase 6
 * 
 * Mission completion celebration modal:
 * - Certificate display with user name
 * - Performance score and tier
 * - Achievement badges earned
 * - Share buttons
 * - Download certificate option
 */

import { useState, useEffect } from 'react';
import { Download, Share2, Trophy, Star, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CertificateModal({ isOpen, onClose, certificate }) {
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Show confetti on mount if excellent score
  useEffect(() => {
    if (isOpen && certificate?.performance?.overallScore >= 90) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [isOpen, certificate]);
  
  if (!certificate) return null;
  
  const handleShare = () => {
    if (certificate.shareableText) {
      if (navigator.share) {
        navigator.share({
          title: 'GroundCTRL Mission Complete!',
          text: certificate.shareableText,
        }).catch(err => console.log('Share cancelled', err));
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(certificate.shareableText);
        alert('Certificate text copied to clipboard!');
      }
    }
  };
  
  const handleDownload = () => {
    // Future: Generate PDF certificate
    alert('PDF download coming soon!');
  };
  
  const getTierColor = (tierName) => {
    switch (tierName?.toUpperCase()) {
      case 'EXCELLENT':
        return 'text-yellow-500 bg-yellow-500/20 border-yellow-500';
      case 'GOOD':
        return 'text-blue-500 bg-blue-500/20 border-blue-500';
      case 'SATISFACTORY':
        return 'text-green-500 bg-green-500/20 border-green-500';
      default:
        return 'text-gray-500 bg-gray-500/20 border-gray-500';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Mission Complete!
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription>
            Congratulations on completing your mission!
          </DialogDescription>
        </DialogHeader>
        
        {/* Certificate Display */}
        <div className="space-y-6 py-4">
          {/* Header */}
          <div className="text-center space-y-2 border-b pb-4">
            <div className="text-sm text-muted-foreground uppercase tracking-wider">
              Certificate of Completion
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              ID: {certificate.id?.substring(0, 20)}...
            </div>
          </div>
          
          {/* Main Content */}
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">This certifies that</p>
              <p className="text-2xl font-bold text-foreground">{certificate.userName}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">has successfully completed</p>
              <p className="text-xl font-semibold text-primary">{certificate.mission?.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">on</p>
              <p className="text-sm font-medium">{certificate.completionDateFormatted}</p>
            </div>
          </div>
          
          {/* Performance Summary */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Score</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {certificate.performance?.overallScore || 0}
                </span>
                <span className="text-muted-foreground">/100</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Performance Tier</span>
              <Badge 
                variant="outline"
                className={`${getTierColor(certificate.performance?.tier?.name)}`}
              >
                {certificate.performance?.tier?.badge} {certificate.performance?.tier?.label}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border/50">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Duration</div>
                <div className="text-sm font-semibold">{certificate.performance?.duration}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Commands</div>
                <div className="text-sm font-semibold">{certificate.performance?.commandsIssued}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Completion</div>
                <div className="text-sm font-semibold">{certificate.performance?.stepsCompleted}</div>
              </div>
            </div>
          </div>
          
          {/* Achievements */}
          {certificate.performance?.achievements && certificate.performance.achievements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold">Achievements Unlocked</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {certificate.performance.achievements.map((achievement, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs border-primary/30 bg-primary/5"
                  >
                    {achievement.badge} {achievement.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
          
          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              GroundCTRL - Satellite Operations Training
            </p>
            <p className="text-xs text-muted-foreground">
              Certificate ID: {certificate.id}
            </p>
          </div>
        </div>
        
        {/* Confetti effect placeholder */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <div className="text-6xl animate-bounce">🎉</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
