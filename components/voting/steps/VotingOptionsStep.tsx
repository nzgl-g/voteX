import { useState } from "react";
import { Label } from "@/components/shadcn-ui/label";
import { InfoTooltip } from "@/components/voting/InfoTooltip";
import { FeatureCard } from "@/components/voting/FeatureCard";
import { LockedFeatureCard } from "@/components/voting/LockedFeatureCard";
import { Button } from "@/components/shadcn-ui/button";
import { Input } from "@/components/shadcn-ui/input";
import { Textarea } from "@/components/shadcn-ui/textarea";
import { CandidateEntryType, PlanType, VotingSessionType } from "@/lib/voting";
import {
  PlusIcon,
  XIcon,
  PencilIcon,
  MailIcon,
  UserPlusIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CalendarIcon,
  FileTextIcon,
  UserIcon,
  AtSignIcon
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/shadcn-ui/card";
import { Badge } from "@/components/shadcn-ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs";
import { Separator } from "@/components/shadcn-ui/separator";

interface VotingOptionsStepProps {
  formData: {
    options: { title: string; description: string }[];
    candidateEntryMethod: CandidateEntryType;
    candidates: { name: string; email: string }[];
  };
  updateFormData: (data: Partial<{
    options: { title: string; description: string }[];
    candidateEntryMethod: CandidateEntryType;
    candidates: { name: string; email: string }[];
  }>) => void;
  plan: PlanType;
  sessionType: VotingSessionType;
}

export function VotingOptionsStep({ formData, updateFormData, plan, sessionType }: VotingOptionsStepProps) {
  const [newOption, setNewOption] = useState({ title: "", description: "" });
  const [newCandidate, setNewCandidate] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState<{
    optionTitle?: string;
    candidateName?: string;
    candidateEmail?: string;
  }>({});

  const handleAddOption = () => {
    if (!newOption.title.trim()) {
      setErrors(prev => ({ ...prev, optionTitle: "Title is required" }));
      return;
    }

    const updatedOptions = [...formData.options, { ...newOption }];
    updateFormData({ options: updatedOptions });
    setNewOption({ title: "", description: "" });
    setErrors(prev => ({ ...prev, optionTitle: undefined }));
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = [...formData.options];
    updatedOptions.splice(index, 1);
    updateFormData({ options: updatedOptions });
  };

  const handleCandidateMethodSelect = (method: CandidateEntryType) => {
    if (method === "open" || plan !== "free") {
      updateFormData({ candidateEntryMethod: method });
    }
  };

  const handleAddCandidate = () => {
    const errors: { candidateName?: string; candidateEmail?: string } = {};

    if (!newCandidate.name.trim()) {
      errors.candidateName = "Name is required";
    }

    if (!newCandidate.email.trim()) {
      errors.candidateEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(newCandidate.email)) {
      errors.candidateEmail = "Email is invalid";
    }

    if (Object.keys(errors).length > 0) {
      setErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    const updatedCandidates = [...formData.candidates, { ...newCandidate }];
    updateFormData({ candidates: updatedCandidates });
    setNewCandidate({ name: "", email: "" });
    setErrors(prev => ({ ...prev, candidateName: undefined, candidateEmail: undefined }));
  };

  const handleRemoveCandidate = (index: number) => {
    const updatedCandidates = [...formData.candidates];
    updatedCandidates.splice(index, 1);
    updateFormData({ candidates: updatedCandidates });
  };

  return (
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-primary">
            {sessionType === "poll" ? "Poll Options" : "Candidate Management"}
          </CardTitle>
          <CardDescription>
            {sessionType === "poll"
                ? "Configure the options voters can choose from"
                : "Set up how candidates will be added to your voting session"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {sessionType === "poll" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Poll Options</h3>
                    <InfoTooltip text="Add voting options for your poll." />
                  </div>
                  <Badge variant="outline" className="bg-primary/5">
                    {formData.options.length} Options Added
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Add New Option Card */}
                  <Card className="border-2 border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PlusIcon className="h-5 w-5 text-primary" />
                        Add New Option
                      </CardTitle>
                      <CardDescription>
                        Create a new option for voters to select
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="option-title" className="font-medium">Option Title</Label>
                        <Input
                            id="option-title"
                            value={newOption.title}
                            onChange={(e) => setNewOption(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter option title"
                            className={errors.optionTitle ? "border-destructive" : ""}
                        />
                        {errors.optionTitle && (
                            <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                              <AlertCircleIcon className="h-3 w-3" />
                              <span>{errors.optionTitle}</span>
                            </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="option-description" className="font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Textarea
                            id="option-description"
                            value={newOption.description}
                            onChange={(e) => setNewOption(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Provide additional details about this option"
                            rows={3}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                          type="button"
                          onClick={handleAddOption}
                          className="w-full gap-2"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Option
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Current Options */}
                  {formData.options.length > 0 && (
                      <div className="bg-muted/5 rounded-lg border p-4">
                        <h3 className="font-medium text-sm text-muted-foreground mb-3">CURRENT OPTIONS</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                          {formData.options.map((option, index) => (
                              <div key={index} className="flex items-start gap-3 bg-background rounded-lg p-3 border-l-4 border-l-primary shadow-sm">
                                <div className="flex-1">
                                  <p className="font-medium">{option.title}</p>
                                  {option.description && (
                                      <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                                  )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveOption(index)}
                                    className="h-8 w-8 p-0 rounded-full"
                                >
                                  <XIcon className="h-4 w-4" />
                                </Button>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}
                </div>
              </div>
          )}

          {(sessionType === "election" || sessionType === "tournament") && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Candidate Entry Method</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose how candidates will be added to your {sessionType === "election" ? "election" : "tournament"}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plan === "free" ? (
                        <>
                          <Card className="border-2 bg-muted/5 opacity-80">
                            <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                              <div className="p-2 rounded-full bg-muted">
                                <PencilIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="pl-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                  Manual Entry
                                  <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">Pro</span>
                                </CardTitle>
                                <CardDescription>Add candidates yourself</CardDescription>
                              </div>
                            </CardHeader>
                          </Card>

                          <Card className="border-2 bg-muted/5 opacity-80">
                            <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                              <div className="p-2 rounded-full bg-muted">
                                <MailIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="pl-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                  Email Invite
                                  <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">Pro</span>
                                </CardTitle>
                                <CardDescription>Send invites to candidates</CardDescription>
                              </div>
                            </CardHeader>
                          </Card>
                        </>
                    ) : (
                        <>
                          <Card
                              className={`border-2 cursor-pointer transition-all ${
                                  formData.candidateEntryMethod === "manual"
                                      ? "border-primary bg-primary/5"
                                      : "hover:border-primary/30"
                              }`}
                              onClick={() => handleCandidateMethodSelect("manual")}
                          >
                            <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                              <div className={`p-2 rounded-full ${
                                  formData.candidateEntryMethod === "manual" ? "bg-primary/10" : "bg-muted"
                              }`}>
                                <PencilIcon className={`h-5 w-5 ${
                                    formData.candidateEntryMethod === "manual" ? "text-primary" : "text-muted-foreground"
                                }`} />
                              </div>
                              <div className="pl-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                  Manual Entry
                                  {formData.candidateEntryMethod === "manual" && (
                                      <CheckCircleIcon className="h-4 w-4 text-primary" />
                                  )}
                                </CardTitle>
                                <CardDescription>Add candidates yourself</CardDescription>
                              </div>
                            </CardHeader>
                          </Card>

                          <Card
                              className={`border-2 cursor-pointer transition-all ${
                                  formData.candidateEntryMethod === "email"
                                      ? "border-primary bg-primary/5"
                                      : "hover:border-primary/30"
                              }`}
                              onClick={() => handleCandidateMethodSelect("email")}
                          >
                            <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                              <div className={`p-2 rounded-full ${
                                  formData.candidateEntryMethod === "email" ? "bg-primary/10" : "bg-muted"
                              }`}>
                                <MailIcon className={`h-5 w-5 ${
                                    formData.candidateEntryMethod === "email" ? "text-primary" : "text-muted-foreground"
                                }`} />
                              </div>
                              <div className="pl-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                  Email Invite
                                  {formData.candidateEntryMethod === "email" && (
                                      <CheckCircleIcon className="h-4 w-4 text-primary" />
                                  )}
                                </CardTitle>
                                <CardDescription>Send invites to candidates</CardDescription>
                              </div>
                            </CardHeader>
                          </Card>
                        </>
                    )}

                    <Card
                        className={`border-2 cursor-pointer transition-all ${
                            formData.candidateEntryMethod === "open"
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/30"
                        }`}
                        onClick={() => handleCandidateMethodSelect("open")}
                    >
                      <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                        <div className={`p-2 rounded-full ${
                            formData.candidateEntryMethod === "open" ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <UserPlusIcon className={`h-5 w-5 ${
                              formData.candidateEntryMethod === "open" ? "text-primary" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div className="pl-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            Open Nomination
                            {formData.candidateEntryMethod === "open" && (
                                <CheckCircleIcon className="h-4 w-4 text-primary" />
                            )}
                          </CardTitle>
                          <CardDescription>Allow public nominations</CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                </div>

                {formData.candidateEntryMethod === "manual" && plan !== "free" && (
                    <div className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Manual Candidate Entry</h3>
                        <Badge variant="outline" className="bg-primary/5">
                          {formData.candidates.length} Candidates Added
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Add New Candidate */}
                        <Card className="border-2 border-dashed">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <UserPlusIcon className="h-5 w-5 text-primary" />
                              Add New Candidate
                            </CardTitle>
                            <CardDescription>
                              Manually add a candidate to your {sessionType}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="candidate-name" className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                <span>Candidate Name</span>
                              </Label>
                              <Input
                                  id="candidate-name"
                                  value={newCandidate.name}
                                  onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Enter full name"
                                  className={errors.candidateName ? "border-destructive" : ""}
                              />
                              {errors.candidateName && (
                                  <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                                    <AlertCircleIcon className="h-3 w-3" />
                                    <span>{errors.candidateName}</span>
                                  </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="candidate-email" className="flex items-center gap-2">
                                <AtSignIcon className="h-4 w-4 text-muted-foreground" />
                                <span>Email Address</span>
                              </Label>
                              <Input
                                  id="candidate-email"
                                  type="email"
                                  value={newCandidate.email}
                                  onChange={(e) => setNewCandidate(prev => ({ ...prev, email: e.target.value }))}
                                  placeholder="name@example.com"
                                  className={errors.candidateEmail ? "border-destructive" : ""}
                              />
                              {errors.candidateEmail && (
                                  <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                                    <AlertCircleIcon className="h-3 w-3" />
                                    <span>{errors.candidateEmail}</span>
                                  </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button
                                type="button"
                                onClick={handleAddCandidate}
                                className="w-full gap-2"
                            >
                              <PlusIcon className="h-4 w-4" />
                              Add Candidate
                            </Button>
                          </CardFooter>
                        </Card>

                        {/* Current Candidates */}
                        {formData.candidates.length > 0 && (
                            <div className="bg-muted/5 rounded-lg border p-4">
                              <h3 className="font-medium text-sm text-muted-foreground mb-3">CURRENT CANDIDATES</h3>
                              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {formData.candidates.map((candidate, index) => (
                                    <div key={index} className="flex items-center gap-3 bg-background rounded-lg p-3 border shadow-sm">
                                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                        {candidate.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium">{candidate.name}</p>
                                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                                      </div>
                                      <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleRemoveCandidate(index)}
                                          className="h-8 w-8 p-0 rounded-full"
                                      >
                                        <XIcon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                ))}
                              </div>
                            </div>
                        )}
                      </div>
                    </div>
                )}

                {formData.candidateEntryMethod === "email" && plan !== "free" && (
                    <div className="mt-6">
                      <Tabs defaultValue="template" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="template">Email Template</TabsTrigger>
                          <TabsTrigger value="recipients">Recipients</TabsTrigger>
                        </TabsList>
                        <TabsContent value="template" className="mt-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Candidate Invitation Email</CardTitle>
                              <CardDescription>
                                Customize the email that will be sent to potential candidates
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Email Subject</Label>
                                    <Input
                                        defaultValue={`Invitation to participate in ${sessionType === "election" ? "Election" : "Tournament"}`}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Sender Name</Label>
                                    <Input defaultValue="Your Organization" />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Email Message</Label>
                                  <Textarea
                                      rows={6}
                                      defaultValue={`Dear [Candidate],

We'd like to invite you to participate in our upcoming ${sessionType === "election" ? "Election" : "Tournament"} for [Organization]. If you're interested, please complete the candidate profile by clicking the link below:

[Registration Link]

Thanks,
[Your Name]`}
                                  />
                                </div>

                                <div className="rounded-md border p-3 bg-muted/5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <InfoTooltip text="These placeholders will be automatically replaced with actual values in the email." />
                                    <span className="text-sm font-medium">Available Placeholders</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {["[Candidate]", "[Organization]", "[Registration Link]", "[Your Name]"].map((tag, i) => (
                                        <Badge key={i} variant="secondary" className="bg-primary/10">
                                          {tag}
                                        </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                        <TabsContent value="recipients" className="mt-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Add Recipients</CardTitle>
                              <CardDescription>
                                Add email addresses of potential candidates
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Add Multiple Emails</Label>
                                  <Textarea
                                      placeholder="Enter one email per line"
                                      rows={6}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Each line should contain a single email address
                                  </p>
                                </div>

                                <Separator className="my-4" />

                                <div className="space-y-2">
                                  <Label>Upload CSV File</Label>
                                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                    <Button variant="outline" className="gap-2">
                                      <FileTextIcon className="h-4 w-4" />
                                      Select CSV File
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Upload a CSV with columns: Name, Email
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button className="w-full gap-2">
                                <MailIcon className="h-4 w-4" />
                                Send Invitations
                              </Button>
                            </CardFooter>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </div>
                )}

                {formData.candidateEntryMethod === "open" && (
                    <div className="mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <UserPlusIcon className="h-5 w-5 text-primary" />
                            Open Nomination Settings
                          </CardTitle>
                          <CardDescription>
                            Configure how public nominations will work
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="nomination-start" className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                  <span>Nomination Start Date</span>
                                </Label>
                                <Input
                                    id="nomination-start"
                                    type="date"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="nomination-end" className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                  <span>Nomination End Date</span>
                                </Label>
                                <Input
                                    id="nomination-end"
                                    type="date"
                                />
                              </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="required-info" className="flex items-center gap-2">
                                  <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                                  <span>Required Information</span>
                                </Label>
                                <Badge variant="outline">Form Fields</Badge>
                              </div>
                              <Textarea
                                  id="required-info"
                                  placeholder="Enter information required from candidates"
                                  defaultValue="Name
Email
Bio (max 300 words)
Profile picture"
                                  rows={4}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                List all information fields that candidates must provide when nominating
                              </p>
                            </div>

                            <div className="rounded-md bg-muted/10 p-4 border-l-4 border-l-primary">
                              <h4 className="font-medium mb-1">Nomination Preview</h4>
                              <p className="text-sm text-muted-foreground">
                                A public nomination form will be created with the fields you specified above.
                                Candidates will be able to submit their information during the nomination period.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                )}
              </div>
          )}
        </CardContent>
      </Card>
  );
}