import { Button } from "@/components/shadcn-ui/button";
import { PlanType } from "@/lib/voting";
import { format } from "date-fns";
import {
    CheckIcon,
    LockIcon,
    PencilIcon,
    CalendarIcon,
    UsersIcon,
    ShieldIcon,
    BarChartIcon,
    ListIcon,
    UserIcon,
    BuildingIcon,
    FileTextIcon
} from "lucide-react";

interface SummaryStepProps {
    formData: {
        title: string;
        description: string;
        organization: string;
        banner: { id: string; url: string };
        sessionType: string;
        votingMode: string;
        startDate: Date;
        endDate: Date;
        preparationSchedule: Date | null;
        accessControl: string;
        secretPhrase: string;
        csvInviteFile: File | null;
        displayLiveResults: boolean;
        verificationMethod: string;
        options: { title: string; description: string }[];
        candidateEntryMethod: string;
        candidates: { name: string; email: string }[];
    };
    plan: PlanType;
    onEditStep: (stepIndex: number) => void;
}

export function SummaryStep({ formData, plan, onEditStep }: SummaryStepProps) {
    // Get session type display name
    const getSessionTypeDisplay = () => {
        switch(formData.sessionType) {
            case 'poll': return 'Poll';
            case 'election': return 'Election';
            case 'tournament': return 'Tournament';
            default: return formData.sessionType;
        }
    };

    // Format voting mode for display
    const formatVotingMode = (mode: string) => {
        return mode
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header with banner */}
            <div className="rounded-xl overflow-hidden border shadow-sm">
                <div className="relative h-48">
                    {formData.banner.url ? (
                        <img
                            src={formData.banner.url}
                            alt="Session banner"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-100 to-violet-100 flex items-center justify-center">
                            <FileTextIcon className="h-12 w-12 text-muted-foreground opacity-40" />
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                        <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-primary/90 text-white text-xs font-medium rounded-full">
                {getSessionTypeDisplay()}
              </span>
                            {plan !== "free" && (
                                <span className="px-2 py-1 bg-amber-500/90 text-white text-xs font-medium rounded-full">
                  Pro Plan
                </span>
                            )}
                        </div>
                        <h1 className="text-white text-2xl font-bold mt-2 line-clamp-2">{formData.title}</h1>
                    </div>
                </div>

                {/* Main content sections */}
                <div className="bg-white p-6">
                    {/* Organization and description */}
                    <div className="mb-8">
                        <div className="flex items-center text-muted-foreground mb-3">
                            <BuildingIcon className="h-4 w-4 mr-2" />
                            <span>{formData.organization || "No organization specified"}</span>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
                            <p className="text-slate-700">
                                {formData.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    {/* Main summary grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left column */}
                        <div className="space-y-6">
                            {/* Session Configuration */}
                            <SummaryCard
                                icon={<ListIcon className="h-5 w-5 text-indigo-500" />}
                                title="Session Configuration"
                                onEdit={() => onEditStep(1)}
                                items={[
                                    {
                                        label: "Session Type",
                                        value: getSessionTypeDisplay(),
                                        locked: plan === "free" && formData.sessionType !== "poll"
                                    },
                                    {
                                        label: "Voting Mode",
                                        value: formatVotingMode(formData.votingMode),
                                        locked: plan === "free" && formData.sessionType !== "poll"
                                    },
                                ]}
                            />

                            {/* Schedule */}
                            <SummaryCard
                                icon={<CalendarIcon className="h-5 w-5 text-green-500" />}
                                title="Schedule"
                                onEdit={() => onEditStep(2)}
                                items={[
                                    {
                                        label: "Starts",
                                        value: format(formData.startDate, "MMM d, yyyy 'at' h:mm a")
                                    },
                                    {
                                        label: "Ends",
                                        value: format(formData.endDate, "MMM d, yyyy 'at' h:mm a")
                                    },
                                    {
                                        label: "Preparation",
                                        value: formData.preparationSchedule
                                            ? format(formData.preparationSchedule, "MMM d, yyyy")
                                            : "Not scheduled"
                                    },
                                ]}
                            />

                            {/* Results Display */}
                            <SummaryCard
                                icon={<BarChartIcon className="h-5 w-5 text-amber-500" />}
                                title="Results Configuration"
                                onEdit={() => onEditStep(4)}
                                items={[
                                    {
                                        label: "Live Results",
                                        value: formData.displayLiveResults ? "Visible to participants" : "Hidden until completed"
                                    },
                                ]}
                            />
                        </div>

                        {/* Right column */}
                        <div className="space-y-6">
                            {/* Access Control */}
                            <SummaryCard
                                icon={<ShieldIcon className="h-5 w-5 text-red-500" />}
                                title="Access Control"
                                onEdit={() => onEditStep(3)}
                                items={[
                                    {
                                        label: "Access Type",
                                        value: formData.accessControl.charAt(0).toUpperCase() +
                                            formData.accessControl.slice(1).replace(/-/g, " ")
                                    },
                                    formData.accessControl === "secret-phrase"
                                        ? {
                                            label: "Secret Phrase",
                                            value: formData.secretPhrase ? "••••••••" : "Not set",
                                        }
                                        : null,
                                    formData.accessControl === "csv-invite"
                                        ? {
                                            label: "Invitations",
                                            value: formData.csvInviteFile ? `File: ${formData.csvInviteFile.name}` : "No file uploaded",
                                        }
                                        : null,
                                ].filter(Boolean) as { label: string; value: string; locked?: boolean }[]}
                            />

                            {/* Verification */}
                            <SummaryCard
                                icon={<UserIcon className="h-5 w-5 text-blue-500" />}
                                title="Voter Verification"
                                onEdit={() => onEditStep(5)}
                                items={[
                                    {
                                        label: "Method",
                                        value: formData.verificationMethod === "standard"
                                            ? "Standard Verification"
                                            : "Enhanced KYC Verification",
                                        locked: plan === "free" && formData.verificationMethod !== "standard"
                                    },
                                ]}
                            />

                            {/* Poll Options */}
                            {formData.sessionType === "poll" && (
                                <SummaryCard
                                    icon={<ListIcon className="h-5 w-5 text-purple-500" />}
                                    title="Voting Options"
                                    onEdit={() => onEditStep(6)}
                                    items={[
                                        {
                                            label: "Total Options",
                                            value: `${formData.options.length} option${formData.options.length !== 1 ? 's' : ''}`
                                        },
                                        ...formData.options.slice(0, 3).map((option, index) => ({
                                            label: `Option ${index + 1}`,
                                            value: option.title,
                                            description: option.description
                                        })),
                                        formData.options.length > 3
                                            ? {
                                                label: "",
                                                value: `+ ${formData.options.length - 3} more options`,
                                                className: "text-primary italic"
                                            }
                                            : null,
                                    ].filter(Boolean) as { label: string; value: string; description?: string; locked?: boolean; className?: string }[]}
                                />
                            )}

                            {/* Candidates */}
                            {(formData.sessionType === "election" || formData.sessionType === "tournament") && (
                                <SummaryCard
                                    icon={<UsersIcon className="h-5 w-5 text-purple-500" />}
                                    title="Candidates"
                                    onEdit={() => onEditStep(6)}
                                    items={[
                                        {
                                            label: "Entry Method",
                                            value: formData.candidateEntryMethod === "manual"
                                                ? "Manual Entry"
                                                : formData.candidateEntryMethod === "email"
                                                    ? "Email Invite"
                                                    : "Open Nomination",
                                            locked: plan === "free" && formData.candidateEntryMethod !== "open"
                                        },
                                        formData.candidateEntryMethod === "manual" && plan !== "free"
                                            ? {
                                                label: "Total Candidates",
                                                value: `${formData.candidates.length} candidate${formData.candidates.length !== 1 ? 's' : ''}`
                                            }
                                            : null,
                                        ...((formData.candidateEntryMethod === "manual" && plan !== "free")
                                                ? formData.candidates.slice(0, 3).map((candidate, index) => ({
                                                    label: `Candidate ${index + 1}`,
                                                    value: candidate.name,
                                                    description: candidate.email
                                                }))
                                                : []
                                        ),
                                        formData.candidates.length > 3 && formData.candidateEntryMethod === "manual" && plan !== "free"
                                            ? {
                                                label: "",
                                                value: `+ ${formData.candidates.length - 3} more candidates`,
                                                className: "text-primary italic"
                                            }
                                            : null,
                                    ].filter(Boolean) as { label: string; value: string; description?: string; locked?: boolean; className?: string }[]}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status card */}
            <div className="bg-slate-50 rounded-xl p-6 border shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">Session Status</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                        <CheckIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">Your voting session is configured and ready to publish</span>
                    </div>

                    {plan === "free" && (
                        <div className="flex items-center gap-3 text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200">
                            <LockIcon className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">Some advanced features are locked with your current plan</p>
                                <p className="text-sm text-slate-500 mt-1">Upgrade to Pro to unlock all features</p>
                            </div>
                            <Button className="ml-auto" size="sm">Upgrade</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface SummaryCardProps {
    icon: React.ReactNode;
    title: string;
    items: {
        label: string;
        value: string;
        description?: string;
        locked?: boolean;
        className?: string;
    }[];
    onEdit: () => void;
}

function SummaryCard({ icon, title, items, onEdit }: SummaryCardProps) {
    return (
        <div className="rounded-lg border shadow-sm bg-white overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center">
                    {icon}
                    <h3 className="font-medium ml-2 text-slate-700">{title}</h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs hover:bg-slate-200"
                    onClick={onEdit}
                >
                    <PencilIcon className="h-3 w-3" />
                    Edit
                </Button>
            </div>

            <div className="p-4">
                <dl className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className={`${item.className || ''}`}>
                            {item.label && (
                                <dt className="text-xs font-medium text-slate-500 mb-1">{item.label}</dt>
                            )}
                            <dd className="text-sm text-slate-700">
                                {item.locked ? (
                                    <div className="flex items-center gap-1 text-slate-400">
                                        <LockIcon className="h-3 w-3 flex-shrink-0" />
                                        <span>{item.value}</span>
                                        <span className="text-xs ml-1 bg-slate-100 px-1 py-0.5 rounded">Pro Feature</span>
                                    </div>
                                ) : (
                                    <div>
                                        <div>{item.value}</div>
                                        {item.description && (
                                            <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                                        )}
                                    </div>
                                )}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}