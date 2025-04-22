import { Shield, Lock, Clock } from "lucide-react"

export default function TrustBar() {
  return (
    <section className="py-8 bg-muted/20">
      <div className="container">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Bank-Level Encryption</span>
          </div>
          <div className="hidden md:block h-4 w-px bg-border"></div>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">GDPR-Compliant</span>
          </div>
          <div className="hidden md:block h-4 w-px bg-border"></div>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">99.9% Uptime</span>
          </div>
        </div>
      </div>
    </section>
  )
}
