import Link from "next/link";
import {
  Mail,
  MessageSquare,
  BarChart3,
  Users,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Mail,
    title: "Email Campaigns",
    description:
      "Send beautiful, insurance-specific email campaigns with merge fields, templates, and A/B testing built in.",
  },
  {
    icon: Zap,
    title: "Drip Sequences",
    description:
      "Automate renewal reminders, onboarding flows, cross-sell drips, and win-back campaigns that run on autopilot.",
  },
  {
    icon: MessageSquare,
    title: "Two-Way SMS",
    description:
      "Send and receive text messages with clients. SMS campaigns, auto-responses, and threaded conversations.",
  },
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Import contacts, sync from your management system, segment by any field, and track every interaction.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track opens, clicks, engagement scores, and campaign ROI. Know exactly what is working.",
  },
  {
    icon: Shield,
    title: "Compliance Built In",
    description:
      "CAN-SPAM and TCPA compliant. Unsubscribe management, preference centers, and suppression lists included.",
  },
];

const templates = [
  "Renewal Reminders (90/60/30 day)",
  "Birthday Greetings",
  "New Client Welcome",
  "Annual Policy Review",
  "Cross-Sell Prompts",
  "Post-Claim Check-In",
  "Referral Requests",
  "Holiday Messages",
  "Policy Change Confirmations",
  "Thank You / Appreciation",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Mail className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold tracking-tight">
                AgencyMail
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#templates"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Templates
              </a>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">
                  Get Started
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Marketing That Speaks{" "}
              <span className="text-primary">Insurance</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Email campaigns, drip sequences, SMS messaging, and analytics
              purpose-built for insurance agencies. Connect with clients at
              every touchpoint.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base px-8"
                >
                  See Features
                </Button>
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required. 14-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything Your Agency Needs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for insurance agencies, not adapted from
              generic tools. Every feature understands your workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-200"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Insurance Templates, Ready to Send
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Pre-built email templates designed for insurance touchpoints.
                Customize with merge fields and your branding. Start sending
                in minutes, not hours.
              </p>
              <div className="mt-8">
                <Link href="/sign-up">
                  <Button size="lg">
                    Browse Templates
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {templates.map((template) => (
                <div
                  key={template}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white border"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{template}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">
            Ready to Transform Your Agency Marketing?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Join agencies already using AgencyMail to build stronger client
            relationships and grow their book of business.
          </p>
          <div className="mt-8">
            <Link href="/sign-up">
              <Button
                size="lg"
                variant="secondary"
                className="text-base px-8"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <span className="font-semibold">AgencyMail</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} AgencyMail. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
