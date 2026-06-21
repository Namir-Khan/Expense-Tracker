import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, PieChart, ShieldCheck, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tally — track every dollar, effortlessly" },
      { name: "description", content: "A calm, lightning-fast expense tracker. Log spending in seconds, see where your money goes, stay on budget." },
      { property: "og:title", content: "Tally — track every dollar, effortlessly" },
      { property: "og:description", content: "A calm, lightning-fast expense tracker. Log spending in seconds, see where your money goes, stay on budget." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </span>
          <span>Tally</span>
        </Link>
        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center sm:pt-28">
        <h1 className="font-serif text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl">
          Track every dollar.
          <br />
          <span className="text-primary">Effortlessly.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          A calm, keyboard-fast personal finance app. Log expenses in two seconds, watch your budget breathe, and finally know where it all goes.
        </p>
        <div className="mt-10">
          <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base">
            <Link to="/login">
              Get started <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-2xl bg-card p-4 shadow-xl sm:p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-background p-5">
              <p className="text-xs text-muted-foreground">Spent this month</p>
              <p className="mt-2 font-mono text-2xl font-semibold">$1,284.40</p>
              <p className="mt-1 text-xs text-muted-foreground">+8.2% vs last month</p>
            </div>
            <div className="rounded-xl bg-background p-5">
              <p className="text-xs text-muted-foreground">Remaining budget</p>
              <p className="mt-2 font-mono text-2xl font-semibold">$1,215.60</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-1/2 rounded-full bg-primary" />
              </div>
            </div>
            <div className="rounded-xl bg-background p-5">
              <p className="text-xs text-muted-foreground">Top category</p>
              <p className="mt-2 text-lg font-semibold">Food & Dining</p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">$412.18</p>
            </div>
          </div>
          <div className="mt-4 flex h-32 items-end gap-3 rounded-xl bg-background p-5">
            {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-md bg-primary/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-12 px-6 pb-24 sm:grid-cols-3">
        {[
          { icon: Zap, title: "Built for speed", desc: "Cmd+K from anywhere. Log an expense in under three seconds." },
          { icon: PieChart, title: "Honest analytics", desc: "Clean charts that show where your money actually goes — no fluff." },
          { icon: ShieldCheck, title: "Yours alone", desc: "Your data stays on your device. No ads, no creepy tracking." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center sm:text-left">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground sm:mx-0">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Tally</span>
          <span>Made with care.</span>
        </div>
      </footer>
    </div>
  );
}
