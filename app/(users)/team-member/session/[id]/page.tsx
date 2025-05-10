import { VoteSessionManagement } from "@/components/session-profile/vote-session-management"
import {SiteHeader} from "@/components/sidebar/site-header";

export default function Home() {
    return (
        <><SiteHeader title="Session Management"/>
            <main className="min-h-screen bg-background">
                <VoteSessionManagement/>
            </main>
        </>
    )
}
