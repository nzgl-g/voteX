"use client"
import  VotingSessionForm  from "@/components/voting/session-form";
import { PlanType } from "@/lib/voting";
import React from "react";

export default function SessionCreationPage({
  searchParams,
}: {
  searchParams: { plan?: PlanType };
}) {
  const plan = searchParams.plan || 'free';
  return (
    <main className="container mx-auto px-4 py-8">
      <VotingSessionForm plan={plan} />
    </main>
  );
}