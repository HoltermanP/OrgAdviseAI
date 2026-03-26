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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ProjectRow = {
  id: string;
  name: string;
  organizationId: string | null;
  organizationName: string;
  sector: string;
  projectGoals?: string;
  status: string;
  analysisCount: number;
};

type OrganizationRow = {
  id: string;
  name: string;
  sector: string;
  size: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [orgFilter, setOrgFilter] = useState("__all__");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    organizationId: "",
    description: "",
    projectGoals: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const projectsUrl =
        orgFilter === "__all__"
          ? "/api/projects"
          : `/api/projects?organizationId=${encodeURIComponent(orgFilter)}`;
      const [pr, or] = await Promise.all([
        fetch(projectsUrl),
        fetch("/api/organizations"),
      ]);
      const data = (await pr.json()) as {
        projects?: ProjectRow[];
        error?: string;
      };
      const orgData = (await or.json()) as {
        organizations?: OrganizationRow[];
        error?: string;
      };
      if (!pr.ok) throw new Error(data.error ?? "Projecten laden mislukt");
      if (!or.ok) throw new Error(orgData.error ?? "Organisaties laden mislukt");
      setProjects(data.projects ?? []);
      setOrganizations(orgData.organizations ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout bij laden");
    } finally {
      setLoading(false);
    }
  }, [orgFilter]);

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
        organizationId: "",
        description: "",
        projectGoals: "",
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
              disabled={organizations.length === 0}
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
                    <Label>Organisatie *</Label>
                    <Select
                      value={form.organizationId}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, organizationId: v ?? "" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kies organisatie" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[var(--gray)]">
                      Nog geen organisatie?{" "}
                      <Link href="/organizations" className="text-[var(--blue)] underline">
                        Maak er eerst een aan
                      </Link>
                      .
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goals">Projectdoelen</Label>
                    <Textarea
                      id="goals"
                      rows={3}
                      value={form.projectGoals}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, projectGoals: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Context / toelichting</Label>
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
                  <Button
                    type="submit"
                    disabled={saving || !form.organizationId}
                    className="bg-[var(--navy)]"
                  >
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
      <div className="flex-1 space-y-4 p-4 sm:p-6">
        {organizations.length > 0 ? (
          <div className="flex max-w-md flex-col gap-2">
            <Label>Filter op organisatie</Label>
            <Select
              value={orgFilter}
              onValueChange={(v) => setOrgFilter(v ?? "__all__")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle projecten</SelectItem>
                <SelectItem value="__none__">Zonder organisatie</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {organizations.length === 0 ? (
          <Card className="mb-4 border-dashed border-[var(--blue)]/40">
            <CardHeader>
              <CardTitle className="text-[var(--navy)]">Eerst een organisatie aanmaken</CardTitle>
              <CardDescription>
                Projecten hangen onder een organisatie. Maak eerst een organisatie met
                bedrijfsinformatie en goedgekeurde websites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/organizations">Naar organisaties</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
        {loading ? (
          <div className="flex justify-center py-16 text-[var(--gray)]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-[var(--navy)]">
                {orgFilter === "__all__" ? "Geen projecten" : "Geen projecten voor dit filter"}
              </CardTitle>
              <CardDescription>
                {orgFilter === "__all__"
                  ? "Maak je eerste project aan om analyses te starten."
                  : "Kies een ander filter of maak een nieuw project onder deze organisatie."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {orgFilter !== "__all__" ? (
                <Button variant="outline" onClick={() => setOrgFilter("__all__")}>
                  Alle projecten tonen
                </Button>
              ) : null}
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
                  {p.projectGoals ? (
                    <p className="line-clamp-3 text-sm text-[var(--gray)]">{p.projectGoals}</p>
                  ) : null}
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
