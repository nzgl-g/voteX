import { Suspense } from "react"
import VotingDashboard from "@/components/monitors/voting-dashboard"
import { DashboardSkeleton } from "@/components/monitors/dashboard-skeleton"
import {SiteHeader} from "@/components/sidebar/site-header";

export default function DashboardPage() {
    return (
        <><SiteHeader title="Get real-time insights into your voting session."/>
            <div className="min-h-screen bg-background">
                <Suspense fallback={<DashboardSkeleton/>}>
                    <VotingDashboard/>
                </Suspense>
            </div>
        </>
    )
}
