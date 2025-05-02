import { Card, CardContent, CardFooter } from "@/components/shadcn-ui/card";
import { Skeleton } from "@/components/shadcn-ui/skeleton";

export function SessionCardSkeleton() {
    return (
        <Card className="overflow-hidden transition-all hover:shadow-lg">
            <Skeleton className="aspect-video w-full bg-muted/80" />
            <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                <Skeleton className="h-9 w-24" />
            </CardFooter>
        </Card>
    );
}