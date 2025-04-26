import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn-ui/card";
import { Icon } from "@/components/shadcn-ui/icon";
import { icons } from "lucide-react";

interface ProblemProps {
  icon: string;
  title: string;
  description: string;
}

const problemList: ProblemProps[] = [
  {
    icon: "ShieldOff",
    title: "Security Vulnerabilities",
    description:
        "Traditional voting systems are susceptible to tampering, data breaches, and unauthorized access, jeopardizing election integrity.",
  },
  {
    icon: "FileWarning",
    title: "Lack of Transparency",
    description:
        "Voters can't always verify whether their votes were counted correctly, leading to distrust in the results.",
  },
  {
    icon: "AlarmClockOff",
    title: "Delays & Inefficiencies",
    description:
        "Manual vote counting and outdated infrastructure cause long delays in result processing and reporting.",
  },
  {
    icon: "UserX",
    title: "Limited Accessibility",
    description:
        "Remote and disabled voters often face difficulties accessing polling places or secure digital alternatives.",
  },
];

export const ProblemSection = () => {
  return (
      <section id="problems" className="container py-24 sm:py-32">
        <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
          <div>
            <h2 className="text-lg text-destructive mb-2 tracking-wider">Problems</h2>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Traditional Voting Systems Fall Short
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Outdated election systems come with significant risks that can impact fairness, accuracy, and voter confidence. Here are some of the core issues they face.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 w-full">
            {problemList.map(({ icon, title, description }, index) => (
                <Card
                    key={title}
                    className="bg-muted/50 dark:bg-card hover:bg-background transition-all delay-75 group/number"
                >
                  <CardHeader>
                    <div className="flex justify-between">
                      <Icon
                          name={icon as keyof typeof icons}
                          size={32}
                          color="hsl(var(--destructive))"
                          className="mb-6 text-destructive"
                      />
                      <span className="text-5xl text-muted-foreground/15 font-medium transition-all delay-75 group-hover/number:text-muted-foreground/30">
                    0{index + 1}
                  </span>
                    </div>

                    <CardTitle>{title}</CardTitle>
                  </CardHeader>

                  <CardContent className="text-muted-foreground">
                    {description}
                  </CardContent>
                </Card>
            ))}
          </div>
        </div>
      </section>
  );
};
