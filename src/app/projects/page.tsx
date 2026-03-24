"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/header";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ProjectRow = {
  id: string;
  name: string;
  organizationName: string;
  sector: string;
  status: string;
  analysisCount: number;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    organizationName: "",
    sector: "",
    size: "",
    description: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = (await res.json()) as {
        projects?: ProjectRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Laden mislukt");
      setProjects(data.projects ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout bij laden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { project?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Aanmaken mislukt");
      toast.success("Project aangemaakt");
      setOpen(false);
      setForm({
        name: "",
        organizationName: "",
        sector: "",
        size: "",
        description: "",
      });
      await load();
      if (data.project?.id) {
        window.location.href = `/projects/${data.project.id}`;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projecten" },
        ]}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              className={buttonVariants({
                className: "bg-[var(--blue)] text-white hover:bg-[var(--blue)]/90",
              })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nieuw project
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <form onSubmit={createProject}>
                <DialogHeader>
                  <DialogTitle>Nieuw project</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Projectnaam *</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org">Organisatie *</Label>
                    <Input
                      id="org"
                      required
                      value={form.organizationName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, organizationName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector">Sector *</Label>
                    <Input
                      id="sector"
                      required
                      value={form.sector}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sector: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Grootte *</Label>
                    <Input
                      id="size"
                      required
                      placeholder="bijv. 50-250 FTE"
                      value={form.size}
                      onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Uitdaging / context</Label>
                    <Textarea
                      id="desc"
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving} className="bg-[var(--navy)]">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opslaan…
                      </>
                    ) : (
                      "Aanmaken"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="flex-1 p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-16 text-[var(--gray)]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-[var(--navy)]">Geen projecten</CardTitle>
              <CardDescription>
                Maak je eerste project aan om analyses te starten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setOpen(true)}>Nieuw project</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Card key={p.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg text-[var(--navy)]">{p.name}</CardTitle>
                    <span
                      className={
                        p.status === "active"
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800"
                          : "rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700"
                      }
                    >
                      {p.status === "active" ? "Actief" : "Gearchiveerd"}
                    </span>
                  </div>
                  <CardDescription>
                    {p.organizationName} · {p.sector}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-3">
                  <p className="text-sm text-[var(--gray)]">
                    {p.analysisCount} {p.analysisCount === 1 ? "analyse" : "analyses"}
                  </p>
                  <Button asChild variant="secondary">
                    <Link href={`/projects/${p.id}`}>Open project</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
