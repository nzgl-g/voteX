import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProfileSettings } from "@/components/user-settings/profile-settings";
import { SecuritySettings } from "@/components/user-settings/security-settings";
import { AppearanceSettings } from "@/components/user-settings/appearance-settings";
import { SupportSettings } from "@/components/user-settings/support-settings";
import { LogoutSection } from "@/components/user-settings/logout";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings as SettingsIcon, Save, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services";

export interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const { toast } = useToast();

    // Fetch user data when dialog opens
    useEffect(() => {
        if (open) {
            setLoading(true);
            authService.fetchUserProfile()
                .then(data => {
                    setUserData(data);
                })
                .catch(error => {
                    toast({
                        title: "Failed to load profile",
                        description: error.message,
                        variant: "destructive"
                    });
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open, toast]);

    const handleSaveSettings = async () => {
        try {
            setLoading(true);
            // The actual saving is handled by individual components
            // This is just to reset the unsaved changes flag
            setHasUnsavedChanges(false);
            toast({
                title: "Settings saved!",
                description: "Your changes have been applied successfully.",
                duration: 3000,
            });
        } catch (error: any) {
            toast({
                title: "Failed to save settings",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsChange = () => {
        setHasUnsavedChanges(true);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] md:max-w-[90vw] lg:max-w-[900px] p-0 h-[90vh] max-h-[90vh] overflow-hidden border border-border bg-background">
                <DialogTitle className="sr-only">User Settings</DialogTitle>
                <DialogDescription className="sr-only">
                    Manage your account settings and preferences
                </DialogDescription>
                
                <div className="flex flex-col h-full w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <div className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-primary" />
                            <h2 className="font-bold text-xl">Settings</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasUnsavedChanges && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={handleSaveSettings}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Save className="h-3.5 w-3.5" />
                                    )}
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
                                            className="w-full justify-start px-6 py-4 data-[state=active]:bg-background rounded-none border-b md:border-b-0 md:border-r-2 data-[state=active]:border-primary capitalize"
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
                                {loading && !userData ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <ScrollArea className="h-full w-full">
                                        <div className="p-6">
                                            <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
                                                <ProfileSettings 
                                                    onSave={handleSettingsChange} 
                                                    userData={userData}
                                                />
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