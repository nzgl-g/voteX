import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  Users,
  ListChecks,
  Bell,
  Lock,
  GaugeCircle
} from "lucide-react";

interface FeaturesProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const featureList: FeaturesProps[] = [
  {
    icon: <ShieldCheck size={24} className="text-primary" />,
    title: "Secure KYC",
    description:
        "Verify voter identity with encrypted, tamper-proof verification through advanced KYC integration.",
  },
  {
    icon: <Users size={24} className="text-primary" />,
    title: "Team Creation",
    description:
        "Organize members into secure teams for campaign management, moderation, and voting oversight.",
  },
  {
    icon: <ListChecks size={24} className="text-primary" />,
    title: "Task Assignment",
    description:
        "Assign and track responsibilities with real-time updates to ensure election tasks are completed efficiently.",
  },
  {
    icon: <Bell size={24} className="text-primary" />,
    title: "Live Notifications",
    description:
        "Stay informed with instant updates on votes, verifications, task completions, and system alerts.",
  },
  {
    icon: <Lock size={24} className="text-primary" />,
    title: "Blockchain Integrity",
    description:
        "Every vote is recorded on a decentralized blockchain ledger, ensuring transparency and immutability.",
  },
  {
    icon: <GaugeCircle size={24} className="text-primary" />,
    title: "Performance Monitoring",
    description:
        "Track voting activity and system health with a clean, intuitive dashboard for admins and teams.",
  },
];

export const FeaturesSection = () => {
  return (
      <section id="features" className="container py-24 sm:py-32">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          Features
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
          Why Trust Our Platform
        </h2>

        <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
          Built for digital democracy—every feature is crafted to make secure, decentralized voting a reality for your organization.
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureList.map(({ icon, title, description }) => (
              <div key={title}>
                <Card className="h-full bg-background border-0 shadow-none">
                  <CardHeader className="flex justify-center items-center">
                    <div className="bg-primary/20 p-2 rounded-full ring-8 ring-primary/10 mb-4 mr-2">
                      {icon}
                    </div>

                    <CardTitle>{title}</CardTitle>
                  </CardHeader>

                  <CardContent className="text-muted-foreground text-center">
                    {description}
                  </CardContent>
                </Card>
              </div>
          ))}
        </div>
      </section>
  );
};