import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/shadcn-ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/shadcn-ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn-ui/select";
import { Button } from "@/components/shadcn-ui/button";

interface AppearanceSettingsProps {
    onSave: () => void;
}

interface ThemeOption {
    id: string;
    name: string;
    class: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
}

const themes: ThemeOption[] = [
    {
        id: "light",
        name: "Light",
        class: "bg-white",
        colors: {
            primary: "bg-blue-600",
            secondary: "bg-gray-100",
            accent: "bg-purple-500",
        }
    },
    {
        id: "dark",
        name: "Dark",
        class: "bg-gray-900",
        colors: {
            primary: "bg-blue-500",
            secondary: "bg-gray-800",
            accent: "bg-purple-400",
        }
    },
    {
        id: "cyberpunk",
        name: "Cyberpunk",
        class: "bg-black",
        colors: {
            primary: "bg-pink-500",
            secondary: "bg-yellow-400",
            accent: "bg-blue-500",
        }
    },
    {
        id: "retro",
        name: "Retro",
        class: "bg-amber-50",
        colors: {
            primary: "bg-amber-600",
            secondary: "bg-emerald-700",
            accent: "bg-red-600",
        }
    }
];

const fontOptions = [
    { value: "sans", label: "Sans-serif", className: "font-sans" },
    { value: "serif", label: "Serif", className: "font-serif" },
    { value: "mono", label: "Monospace", className: "font-mono" },
];

export function AppearanceSettings({ onSave }: AppearanceSettingsProps) {
    const [selectedTheme, setSelectedTheme] = useState("light");
    const [selectedFont, setSelectedFont] = useState("sans");
    const { toast } = useToast();

    const handleThemeChange = (themeId: string) => {
        setSelectedTheme(themeId);

        // Simulate theme change with animation
        document.documentElement.classList.add("theme-transition");

        setTimeout(() => {
            toast({
                title: "Theme updated!",
                description: `${themes.find(t => t.id === themeId)?.name} theme applied`,
                duration: 2000,
            });

            document.documentElement.classList.remove("theme-transition");
            onSave();
        }, 300);
    };

    const handleFontChange = (value: string) => {
        setSelectedFont(value);

        // Apply font preview
        document.documentElement.style.setProperty(
            "--font-family",
            value === "sans"
                ? `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
                : value === "serif"
                    ? `Georgia, Cambria, "Times New Roman", Times, serif`
                    : `Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
        );

        toast({
            title: "Font updated!",
            description: `${fontOptions.find(f => f.value === value)?.label} font applied`,
            duration: 2000,
        });

        onSave();
    };

    const resetToDefaults = () => {
        setSelectedTheme("light");
        setSelectedFont("sans");

        document.documentElement.style.setProperty(
            "--font-family",
            `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
        );

        toast({
            title: "Settings reset",
            description: "Appearance settings restored to defaults",
            duration: 2000,
        });

        onSave();
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium">Appearance Settings</h3>
                <p className="text-sm text-gray-500">
                    Customize how the application looks and feels.
                </p>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <Label className="text-base">Theme</Label>
                    <RadioGroup
                        value={selectedTheme}
                        onValueChange={handleThemeChange}
                        className="grid grid-cols-2 gap-4 pt-2"
                    >
                        {themes.map(theme => (
                            <Label
                                key={theme.id}
                                htmlFor={`theme-${theme.id}`}
                                className={`
                  flex flex-col items-start p-4 gap-3 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedTheme === theme.id ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-gray-400'}
                `}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-medium">{theme.name}</span>
                                    <RadioGroupItem value={theme.id} id={`theme-${theme.id}`} />
                                </div>
                                <div className={`w-full h-16 rounded-md ${theme.class} flex items-center justify-center p-2`}>
                                    <div className="flex gap-1">
                                        <div className={`w-6 h-6 rounded-full ${theme.colors.primary}`}></div>
                                        <div className={`w-6 h-6 rounded-full ${theme.colors.secondary}`}></div>
                                        <div className={`w-6 h-6 rounded-full ${theme.colors.accent}`}></div>
                                    </div>
                                </div>
                            </Label>
                        ))}
                    </RadioGroup>
                </div>

                <div className="space-y-3 pt-4 border-t">
                    <Label htmlFor="font-selector" className="text-base">Font Style</Label>
                    <Select value={selectedFont} onValueChange={handleFontChange}>
                        <SelectTrigger className="w-full sm:w-[240px]" id="font-selector">
                            <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                            {fontOptions.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className={option.className}
                                >
                                    {option.label} - The quick brown fox
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="mt-4 p-4 rounded-lg border bg-muted/50">
                        <h4 className={`text-lg mb-2 font-medium ${fontOptions.find(f => f.value === selectedFont)?.className}`}>
                            Text Preview
                        </h4>
                        <p className={`text-sm ${fontOptions.find(f => f.value === selectedFont)?.className}`}>
                            The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the alphabet.
                        </p>
                    </div>
                </div>

                <div className="pt-6 flex justify-end">
                    <Button
                        variant="outline"
                        onClick={resetToDefaults}
                    >
                        Reset to Defaults
                    </Button>
                </div>
            </div>
        </div>
    );
}
