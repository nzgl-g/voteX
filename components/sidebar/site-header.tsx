import { SidebarTrigger } from "@/components/shadcn-ui/sidebar";
import { Separator } from "@/components/shadcn-ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/shadcn-ui/breadcrumb";
import { ThemeToggle } from "@/components/shadcn-ui/theme-toggle";

type SiteHeaderProps = {
    title: string;
};

export function SiteHeader({ title }: SiteHeaderProps) {
    return (
        <header className="bg-background sticky top-0 z-50 flex h-14 items-center gap-2 px-3 rounded-t-md shadow-sm">
            <SidebarTrigger />
            <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb className="flex-1">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage className="line-clamp-1 font-medium">
                            {title}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <ThemeToggle />
        </header>
    )
}

