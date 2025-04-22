import Header from "@/components/landing-page/header"
import Hero from "@/components/landing-page/hero"
import Features from "@/components/landing-page/features"
import Testimonials from "@/components/landing-page/testimonials"
import TrustBar from "@/components/landing-page/trust-bar"
import Footer from "@/components/landing-page/footer"

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col container mx-auto px-4 py-8">
            <Header />
            <main className="flex-1">
                <Hero />
                <Features />
                <Testimonials />
                <TrustBar />
            </main>
            <Footer />
        </div>
    )
}
