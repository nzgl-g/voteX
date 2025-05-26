import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services";
import { useRouter } from "next/navigation";

export function LogoutSection() {
    const { toast } = useToast();
    const router = useRouter();

    const handleLogout = () => {
        // Call the auth service logout method to properly clear tokens
        authService.logout();
        
        toast({
            title: "Successfully logged out",
            description: "See you soon! 👋",
        });

        // Redirect to login page after showing toast
        setTimeout(() => {
            router.push("/");
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
