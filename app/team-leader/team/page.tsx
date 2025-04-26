import TeamManagementDashboard from "@/components/team-manager/team-management-dashboard"
import {SiteHeader} from "@/components/sidebar/site-header";
import React from "react";

export default function Home() {
    return (
        <>
            <SiteHeader title="Get real-time insights into your voting session." />
            <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
                <TeamManagementDashboard />
            </main>
        </>

    )
}
