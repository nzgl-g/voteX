
import { FeatureCard } from "@/components/voting/FeatureCard";
import { LockedFeatureCard } from "@/components/voting/LockedFeatureCard";
import { PlanType, VotingSessionType, VotingMode } from "@/lib/voting";
import { CheckIcon, LineChartIcon, ListChecksIcon, TrendingUpIcon, TrophyIcon, VoteIcon } from "lucide-react";

interface SessionTypeStepProps {
  formData: {
    sessionType: VotingSessionType;
    votingMode: VotingMode;
  };
  updateFormData: (data: Partial<{
    sessionType: VotingSessionType;
    votingMode: VotingMode;
  }>) => void;
  plan: PlanType;
}

export function SessionTypeStep({ formData, updateFormData, plan }: SessionTypeStepProps) {
  const handleTypeSelect = (type: VotingSessionType) => {
    if (type === "poll" || plan !== "free") {
      updateFormData({ sessionType: type });
      
      // Set a default voting mode based on the type
      if (type === "poll") {
        updateFormData({ votingMode: "single-choice" });
      } else if (type === "election") {
        updateFormData({ votingMode: "single-choice" });
      } else if (type === "tournament") {
        updateFormData({ votingMode: "single-elimination" });
      }
    }
  };

  const handleModeSelect = (mode: VotingMode) => {
    updateFormData({ votingMode: mode });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Session Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            title="Poll"
            description="Simple opinion gathering"
            icon={<VoteIcon className="h-8 w-8 text-primary" />}
            selected={formData.sessionType === "poll"}
            onClick={() => handleTypeSelect("poll")}
          />
          
          {plan === "free" ? (
            <LockedFeatureCard
              title="Election"
              description="Formal candidate selection"
              icon={<CheckIcon className="h-8 w-8 text-muted-foreground" />}
              tooltipMessage="Upgrade to Pro to unlock Elections"
              onClick={() => {}}
            />
          ) : (
            <FeatureCard
              title="Election"
              description="Formal candidate selection"
              icon={<CheckIcon className="h-8 w-8 text-primary" />}
              selected={formData.sessionType === "election"}
              onClick={() => handleTypeSelect("election")}
            />
          )}
          
          {plan === "free" ? (
            <LockedFeatureCard
              title="Tournament"
              description="Multi-round competition"
              icon={<TrophyIcon className="h-8 w-8 text-muted-foreground" />}
              tooltipMessage="Upgrade to Pro to unlock Tournaments"
              onClick={() => {}}
            />
          ) : (
            <FeatureCard
              title="Tournament"
              description="Multi-round competition"
              icon={<TrophyIcon className="h-8 w-8 text-primary" />}
              selected={formData.sessionType === "tournament"}
              onClick={() => handleTypeSelect("tournament")}
            />
          )}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Voting Mode</h3>
        
        {formData.sessionType === "poll" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              title="Single Choice"
              description="One option per voter"
              icon={<ListChecksIcon className="h-8 w-8 text-primary" />}
              selected={formData.votingMode === "single-choice"}
              onClick={() => handleModeSelect("single-choice")}
            />
            <FeatureCard
              title="Multiple Choice"
              description="Several options per voter"
              icon={<CheckIcon className="h-8 w-8 text-primary" />}
              selected={formData.votingMode === "multiple-choice"}
              onClick={() => handleModeSelect("multiple-choice")}
            />
            <FeatureCard
              title="Ranked Choice"
              description="Ordered preferences"
              icon={<TrendingUpIcon className="h-8 w-8 text-primary" />}
              selected={formData.votingMode === "ranked-choice"}
              onClick={() => handleModeSelect("ranked-choice")}
            />
          </div>
        )}
        
        {formData.sessionType === "election" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              title="Single Choice"
              description="One candidate per voter"
              icon={<ListChecksIcon className="h-8 w-8 text-primary" />}
              selected={formData.votingMode === "single-choice"}
              onClick={() => handleModeSelect("single-choice")}
            />
            <FeatureCard
              title="Multiple Choice"
              description="Several candidates per voter"
              icon={<CheckIcon className="h-8 w-8 text-primary" />}
              selected={formData.votingMode === "multiple-choice"}
              onClick={() => handleModeSelect("multiple-choice")}
            />
            <FeatureCard
              title="Ranked Choice"
              description="Ordered preferences"
              icon={<TrendingUpIcon className="h-8 w-8 text-primary" />}
              selected={formData.votingMode === "ranked-choice"}
              onClick={() => handleModeSelect("ranked-choice")}
            />
          </div>
        )}
        
        {formData.sessionType === "tournament" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              title="Single Elimination"
              description="Losers are eliminated"
              icon={<LineChartIcon className="h-8 w-8 text-primary" />}
              selected={formData.votingMode === "single-elimination"}
              onClick={() => handleModeSelect("single-elimination")}
            />
            <FeatureCard
              title="Double Elimination"
              description="Two losses to eliminate"
              icon={<LineChartIcon className="h-8 w-8 text-primary" />}
              selected={formData.votingMode === "double-elimination"}
              onClick={() => handleModeSelect("double-elimination")}
            />
            <FeatureCard
              title="Round Robin"
              description="Everyone faces everyone"
              icon={<LineChartIcon className="h-8 w-8 text-primary" />}
              selected={formData.votingMode === "round-robin"}
              onClick={() => handleModeSelect("round-robin")}
            />
            <FeatureCard
              title="Knockout"
              description="Successive rounds of elimination"
              icon={<LineChartIcon className="h-8 w-8 text-primary" />}
              selected={formData.votingMode === "knockout"}
              onClick={() => handleModeSelect("knockout")}
            />
            <FeatureCard
              title="Swiss"
              description="Even number of matches"
              icon={<LineChartIcon className="h-8 w-8 text-primary" />}
              selected={formData.votingMode === "swiss"}
              onClick={() => handleModeSelect("swiss")}
            />
          </div>
        )}
        
        {!formData.sessionType && (
          <p className="text-muted-foreground">Please select a session type first</p>
        )}
      </div>
    </div>
  );
}
