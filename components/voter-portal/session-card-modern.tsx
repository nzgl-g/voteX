"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/shadcn-ui/card";
import { Button } from "@/components/shadcn-ui/button";
import { Badge } from "@/components/shadcn-ui/badge";
import { Eye, Award, Vote as VoteIcon, ChartBar, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface SessionCardProps {
  title: string;
  description: string;
  bannerUrl: string;
  status: "nomination" | "started" | "ended" | "upcoming";
  onViewSession: () => void;
  onJoinAsCandidate?: () => void;
  onVote?: () => void;
  onShowResults?: () => void;
}

const statusConfig = {
  nomination: { color: "bg-blue-500/10 text-blue-500", label: "Nomination Phase" },
  started: { color: "bg-green-500/10 text-green-500", label: "Voting Active" },
  ended: { color: "bg-gray-500/10 text-gray-500", label: "Session Ended" },
  upcoming: { color: "bg-purple-500/10 text-purple-500", label: "Upcoming" },
};

export function SessionCard({
  title,
  description,
  bannerUrl,
  status,
  onViewSession,
  onJoinAsCandidate,
  onVote,
  onShowResults,
}: SessionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { color, label } = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card
        className="group relative h-full overflow-hidden bg-card transition-all hover:shadow-lg dark:hover:shadow-primary/5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-video overflow-hidden">
          <img
            src={bannerUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <Badge
            variant="secondary"
            className={`absolute right-3 top-3 ${color}`}
          >
            {label}
          </Badge>
        </div>

        <CardContent className="space-y-3 p-4">
          <motion.h3
            className="line-clamp-1 text-xl font-semibold"
            initial={false}
            animate={{ color: isHovered ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}
            transition={{ duration: 0.2 }}
          >
            {title}
          </motion.h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        </CardContent>

        <CardFooter className="flex flex-wrap justify-end gap-2 p-4 pt-0">
          {status === "nomination" && onJoinAsCandidate && (
            <Button
              variant="outline"
              size="sm"
              className="group/button gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
              onClick={onJoinAsCandidate}
            >
              <Award className="h-4 w-4 transition-transform group-hover/button:scale-110" />
              Join as Candidate
            </Button>
          )}

          {status === "started" && onVote && (
            <Button
              variant="outline"
              size="sm"
              className="group/button gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
              onClick={onVote}
            >
              <VoteIcon className="h-4 w-4 transition-transform group-hover/button:scale-110" />
              Vote Now
            </Button>
          )}

          {status === "ended" && onShowResults && (
            <Button
              variant="outline"
              size="sm"
              className="group/button gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
              onClick={onShowResults}
            >
              <ChartBar className="h-4 w-4 transition-transform group-hover/button:scale-110" />
              View Results
            </Button>
          )}

          {status === "upcoming" && (
            <Button
              variant="outline"
              size="sm"
              className="group/button gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
              onClick={onViewSession}
            >
              <Calendar className="h-4 w-4 transition-transform group-hover/button:scale-110" />
              View Details
            </Button>
          )}

          {(status === "nomination" || status === "started") && (
            <Button
              variant="outline"
              size="sm"
              className="group/button gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
              onClick={onViewSession}
            >
              <Eye className="h-4 w-4 transition-transform group-hover/button:scale-110" />
              View Details
            </Button>
          )}
        </CardFooter>

        <motion.div
          className="absolute bottom-0 left-0 h-1 w-full bg-primary/50"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </Card>
    </motion.div>
  );
}