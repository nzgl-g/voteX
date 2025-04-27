
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/shadcn-ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs";
import { ScrollArea } from "@/components/shadcn-ui/scroll-area";
import { ProfileSettings } from "@/components/user-settngs/profile-settings";
import { SecuritySettings } from "@/components/user-settngs/security-settings";
import { AppearanceSettings } from "@/components/user-settngs/appearance-settings";
import { SupportSettings } from "@/components/user-settngs/support-settings";
import { LogoutSection } from "@/components/user-settngs/logout";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings as SettingsIcon, Save, HelpCircle } from "lucide-react";
import { Button } from "@/components/shadcn-ui/button";

export interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setLoading(true);
            const timer = setTimeout(() => {
                setLoading(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleSaveSettings = () => {
        setHasUnsavedChanges(false);
        toast({
            title: "Settings saved!",
            description: "Your changes have been applied successfully.",
            duration: 3000,
        });
    };

    const handleSettingsChange = () => {
        setHasUnsavedChanges(true);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[900px] p-0 h-[85vh] max-h-[850px] overflow-hidden">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <div className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-indigo-600" />
                            <h2 className="font-bold text-xl">Settings</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasUnsavedChanges && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={handleSaveSettings}
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    <span>Save Changes</span>
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => {
                                    onOpenChange(false);
                                    toast({
                                        title: "Need help?",
                                        description: "Our support team is always ready to assist you.",
                                    });
                                }}
                            >
                                <HelpCircle className="h-3.5 w-3.5" />
                                <span>Help</span>
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="w-full flex flex-col md:flex-row overflow-hidden"
                        >
                            {/* Sidebar */}
                            <div className="bg-muted/50 md:w-[240px] border-r md:h-full">
                                <TabsList className="flex md:flex-col h-auto bg-transparent p-0 w-full">
                                    {['profile', 'security', 'appearance', 'support'].map((tab) => (
                                        <TabsTrigger
                                            key={tab}
                                            value={tab}
                                            className="w-full justify-start px-6 py-4 data-[state=active]:bg-white rounded-none border-b md:border-b-0 md:border-r-2 data-[state=active]:border-indigo-600 capitalize"
                                        >
                                            {tab}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                <div className="hidden md:block p-6 mt-auto border-t">
                                    <LogoutSection />
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 overflow-hidden">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                    </div>
                                ) : (
                                    <ScrollArea className="h-full max-h-[calc(85vh-120px)]">
                                        <div className="p-6">
                                            <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
                                                <ProfileSettings onSave={handleSettingsChange} />
                                            </TabsContent>
                                            <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                                                <SecuritySettings onSave={handleSettingsChange} />
                                            </TabsContent>
                                            <TabsContent value="appearance" className="mt-0 focus-visible:outline-none">
                                                <AppearanceSettings onSave={handleSettingsChange} />
                                            </TabsContent>
                                            <TabsContent value="support" className="mt-0 focus-visible:outline-none">
                                                <SupportSettings />
                                            </TabsContent>
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        </Tabs>
                    </div>

                    {/* Mobile Logout */}
                    <div className="md:hidden border-t p-4">
                        <LogoutSection />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}