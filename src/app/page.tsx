import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Sparkles, LineChart, FileText, Shield } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { BRAND } from "@/lib/brand";

export default async function HomePage() {
  const { userId } = await auth();
  return (
    <div className="min-h-screen bg-[var(--navy)] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <BrandLogo href="/" dark />
        <div className="flex gap-2">
          {userId ? (
            <Button asChild variant="secondary">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href="/sign-in">Inloggen</Link>
              </Button>
              <Button asChild className="bg-[var(--blue)] hover:bg-[var(--blue)]/90">
                <Link href="/sign-up">Start gratis</Link>
              </Button>
            </>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-blue-300">
            {BRAND.websiteName} · Organisatieadvies
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Van diagnose tot rapport — met 100 bewezen adviesmodellen
          </h1>
          <p className="mt-6 text-lg text-blue-100">
            Koppel je projecten, voer analyses uit met Claude, genereer rapporten en
            chat met context over al je bevindingen.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-[var(--blue)] px-8 hover:bg-[var(--blue)]/90"
            >
              <Link href={userId ? "/dashboard" : "/sign-up"}>
                {userId ? "Naar dashboard" : "Account aanmaken"}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/sign-in">Inloggen</Link>
            </Button>
          </div>
        </div>
        <div className="mt-20 grid gap-6 md:grid-cols-2">
          {[
            {
              icon: Sparkles,
              title: "100 modellen",
              body: "Tien categorieën — strategie, cultuur, verandering, HR en meer.",
            },
            {
              icon: LineChart,
              title: "Diepe analyses",
              body: "Claude Opus verwerkt jouw input tot gestructureerde adviezen.",
            },
            {
              icon: FileText,
              title: "Rapporten op maat",
              body: "Quick scan tot volledig adviesrapport, exporteerbaar als PDF.",
            },
            {
              icon: Shield,
              title: "Veilig & privé",
              body: "Clerk-authenticatie en jouw data per project georganiseerd.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <Icon className="h-8 w-8 text-[var(--blue)]" />
              <h2 className="mt-4 text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-blue-100">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
