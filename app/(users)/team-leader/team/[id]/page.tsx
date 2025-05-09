import TeamManagementInterface from "@/components/team-manager/team-management-interface"
import {SiteHeader} from "@/components/sidebar/site-header";

export default function Page() {
  return (
      <><SiteHeader title="Team Management"/>
          <div className="container mx-auto py-8">
              <TeamManagementInterface/>
          </div>
      </>
  )
}
