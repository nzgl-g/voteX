
import { Button } from "@/components/shadcn-ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LogoutSection() {
    const { toast } = useToast();

    const handleLogout = () => {
        toast({
            title: "Successfully logged out",
            description: "See you soon! 👋",
        });

        // In a real application, this would clear auth tokens and redirect
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    return (
        <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={handleLogout}
        >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
        </Button>
    );
}
