import Link from "next/link"

interface AuthFooterProps {
    text: string
    linkText: string
    linkHref: string
}

export function AuthFooter({ text, linkText, linkHref }: AuthFooterProps) {
    return (
        <div className="text-center text-sm">
            {text}{" "}
            <Link href={linkHref} className="font-medium text-primary hover:underline">
                {linkText}
            </Link>
        </div>
    )
}
