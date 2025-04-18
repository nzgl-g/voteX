import { Label } from "@/components/shadcn-ui/label";
import { InfoTooltip } from "@/components/voting/InfoTooltip";
import { FeatureCard } from "@/components/voting/FeatureCard";
import { LockedFeatureCard } from "@/components/voting/LockedFeatureCard";
import { PlanType } from "@/lib/voting";
import { FileUpload } from "@/components/voting/FileUpload";
import { ShieldCheckIcon, UserCheckIcon, CheckCircleIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn-ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs";

interface VoterVerificationStepProps {
  formData: {
    verificationMethod: string;
  };
  updateFormData: (data: Partial<{
    verificationMethod: string;
  }>) => void;
  plan: PlanType;
}

export function VoterVerificationStep({ formData, updateFormData, plan }: VoterVerificationStepProps) {
  const handleVerificationSelect = (method: string) => {
    if (method === "standard" || plan !== "free") {
      updateFormData({ verificationMethod: method });
    }
  };

  return (
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-primary">
            Voter Verification
          </CardTitle>
          <CardDescription>
            Choose how voters will be verified during the voting process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Verification Methods Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
                className={`border-2 transition-all cursor-pointer hover:shadow-md ${
                    formData.verificationMethod === "standard"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                }`}
                onClick={() => handleVerificationSelect("standard")}
            >
              <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <div className={`p-2 rounded-full ${formData.verificationMethod === "standard" ? "bg-primary/10" : "bg-muted"}`}>
                  <UserCheckIcon className={`h-6 w-6 ${formData.verificationMethod === "standard" ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Standard Verification
                    {formData.verificationMethod === "standard" && (
                        <CheckCircleIcon className="h-5 w-5 text-primary" />
                    )}
                  </CardTitle>
                  <CardDescription>Basic identity confirmation</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p className="font-medium">Includes:</p>
                  <ul className="space-y-2">
                    {["Email verification", "CAPTCHA challenges", "Basic duplicate prevention"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/70"></div>
                          <span>{item}</span>
                        </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {plan === "free" ? (
                <Card className="border-2 border-border bg-muted/20 opacity-80">
                  <CardHeader className="flex flex-row items-start gap-4 pb-2">
                    <div className="p-2 rounded-full bg-muted">
                      <ShieldCheckIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        KYC Verification
                        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                      Pro Feature
                    </span>
                      </CardTitle>
                      <CardDescription>Advanced ID matching</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <p className="font-medium">Includes:</p>
                      <ul className="space-y-2 opacity-70">
                        {["ID document upload", "Facial recognition", "Data matching against invites"].map((item, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></div>
                              <span>{item}</span>
                            </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
            ) : (
                <Card
                    className={`border-2 transition-all cursor-pointer hover:shadow-md ${
                        formData.verificationMethod === "kyc"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                    }`}
                    onClick={() => handleVerificationSelect("kyc")}
                >
                  <CardHeader className="flex flex-row items-start gap-4 pb-2">
                    <div className={`p-2 rounded-full ${formData.verificationMethod === "kyc" ? "bg-primary/10" : "bg-muted"}`}>
                      <ShieldCheckIcon className={`h-6 w-6 ${formData.verificationMethod === "kyc" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        KYC Verification
                        {formData.verificationMethod === "kyc" && (
                            <CheckCircleIcon className="h-5 w-5 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription>Advanced ID matching</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <p className="font-medium">Includes:</p>
                      <ul className="space-y-2">
                        {["ID document upload", "Facial recognition", "Data matching against invites"].map((item, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary/70"></div>
                              <span>{item}</span>
                            </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
            )}
          </div>

          {/* KYC Configuration Section */}
          {formData.verificationMethod === "kyc" && plan !== "free" && (
              <div className="mt-8 space-y-6 bg-muted/5 p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">KYC Configuration</h3>
                    <InfoTooltip text="Configure how ID verification will work for your voters" />
                  </div>
                </div>

                <Tabs defaultValue="documents" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="documents">Document Requirements</TabsTrigger>
                    <TabsTrigger value="process">Verification Process</TabsTrigger>
                  </TabsList>
                  <TabsContent value="documents" className="p-4 mt-4 bg-background rounded-md">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground">ACCEPTED DOCUMENTS</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {["Government-issued photo ID", "Driver's license", "Passport", "National ID card"].map((doc, i) => (
                            <div key={i} className="flex items-center gap-2 bg-muted/20 p-3 rounded-md">
                              <CheckCircleIcon className="h-4 w-4 text-primary" />
                              <span className="text-sm">{doc}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="process" className="p-4 mt-4 bg-background rounded-md">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm text-muted-foreground">VERIFICATION FLOW</h4>
                      <ol className="space-y-4">
                        {[
                          "Voter uploads document",
                          "System extracts information",
                          "Data matched against invitation list",
                          "Results shown instantly"
                        ].map((step, i) => (
                            <li key={i} className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {i + 1}
                              </div>
                              <span>{step}</span>
                            </li>
                        ))}
                      </ol>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 pt-6 border-t">
                  <Label className="mb-2 block text-sm font-medium">Upload Verification Template</Label>
                  <FileUpload
                      accept=".csv"
                      onFileChange={() => {}}
                      label="CSV Template"
                      description="Upload CSV with fields to match against ID documents"
                  />
                </div>
              </div>
          )}
        </CardContent>
      </Card>
  );
}