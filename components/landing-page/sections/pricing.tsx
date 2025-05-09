import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

const pricingPlans = [
  {
    id: "free",
    name: "Free",
    subtitle: "100 voter limit",
    price: "$0.00",
    buttonText: "Create",
    actionUrl: "/session-creation?plan=free",
    selectId: "sub-free-001",
    isHighlighted: false,
    features: [
      "Poll voting only",
      "Standard verification",
      "Up to 100 voters",
      "No support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "10,000 voter limit",
    price: "$49.99",
    buttonText: "Buy",
    actionUrl: "/session-creation?plan=pro",
    selectId: "sub-pro-001",
    isHighlighted: true,
    features: [
      "All voting types (polls, elections, tournement)",
      "KYC verification",
      "Full-time priority support",
      "Up to 10,000 voters",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "Unlimited voters",
    price: "$199.99",
    buttonText: "Contact Sales",
    actionUrl: "/contact",
    selectId: "sub-ent-001",
    isHighlighted: false,
    features: [
      "Private blockchain deployment",
      "Unlimited voters and votes",
      "Full-time priority support",
      "Every Thing on pro",
    ],
  },
];

export const PricingSection = () => {
  return (
      <section className="container py-24 sm:py-32">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          Pricing
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
          Get unlimited voting power
        </h2>

        <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground pb-14">
          Choose the plan that fits your organization's scale and voting needs.
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-4">
          {pricingPlans.map(
              ({
                 id,
                 name,
                 subtitle,
                 price,
                 buttonText,
                 actionUrl,
                 isHighlighted,
                 features,
               }) => (
                  <Card
                      key={id}
                      className={
                        isHighlighted
                            ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10 border-[1.5px] border-primary lg:scale-[1.05]"
                            : ""
                      }
                  >
                    <CardHeader>
                      <CardTitle className="pb-1">{name}</CardTitle>
                      <CardDescription className="pb-3">{subtitle}</CardDescription>
                      <div>
                        <span className="text-3xl font-bold">{price}</span>
                        <span className="text-muted-foreground"> /month</span>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        {features.map((feature) => (
                            <div key={feature} className="flex items-start">
                              <Check className="text-primary mr-2 mt-1" />
                              <p>{feature}</p>
                            </div>
                        ))}
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Link href={actionUrl} className="w-full">
                        <Button
                            variant={isHighlighted ? "default" : "secondary"}
                            className="w-full"
                        >
                          {buttonText}
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
              )
          )}
        </div>
      </section>
  );
};
