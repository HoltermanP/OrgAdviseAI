"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
  website: string | null;
  sector: string;
  size: string;
  description: string;
  businessModel: string;
  keyProducts: string;
  marketScope: string;
  headquarters: string;
};

type Source = {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  status: "proposed" | "approved" | "rejected";
};

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [researching, setResearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/organizations/${id}`);
      const j = (await res.json()) as {
        organization?: Organization;
        sources?: Source[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Laden mislukt");
      setOrganization(j.organization ?? null);
      setSources((j.sources ?? []) as Source[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveOrganization() {
    if (!organization) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(organization),
      });
      const j = (await res.json()) as { organization?: Organization; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Opslaan mislukt");
      setOrganization(j.organization ?? organization);
      toast.success("Organisatie opgeslagen");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setSaving(false);
    }
  }

  async function suggestSources() {
    setResearching(true);
    try {
      const res = await fetch(`/api/organizations/${id}/sources/suggest`, {
        method: "POST",
      });
      const j = (await res.json()) as { sources?: Source[]; error?: string; insertedCount?: number };
      if (!res.ok) throw new Error(j.error ?? "Bronnen ophalen mislukt");
      setSources((j.sources ?? []) as Source[]);
      toast.success(`${j.insertedCount ?? 0} bronvoorstellen toegevoegd`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setResearching(false);
    }
  }

  async function updateSource(sourceId: string, status: "approved" | "rejected") {
    try {
      const res = await fetch(`/api/organizations/${id}/sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Bijwerken mislukt");
      await load();
      toast.success(status === "approved" ? "Bron goedgekeurd" : "Bron afgewezen");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    }
  }

  async function removeSource(sourceId: string) {
    try {
      const res = await fetch(`/api/organizations/${id}/sources/${sourceId}`, {
        method: "DELETE",
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Verwijderen mislukt");
      await load();
      toast.success("Bron verwijderd");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    }
  }

  if (loading || !organization) {
    return (
      <>
        <AppHeader
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Organisaties", href: "/organizations" },
            { label: "..." },
          ]}
        />
        <div className="flex flex-1 items-center justify-center p-12 text-[var(--gray)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Organisaties", href: "/organizations" },
          { label: organization.name },
        ]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/projects">Naar projecten</Link>
            </Button>
            <Button onClick={() => void saveOrganization()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opslaan"}
            </Button>
          </>
        }
      />
      <div className="flex-1 space-y-4 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[var(--navy)]">Bedrijfsinformatie</CardTitle>
            <CardDescription>Input voor managementmodellen en analyses.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Naam</Label>
                <Input
                  value={organization.name}
                  onChange={(e) => setOrganization((o) => (o ? { ...o, name: e.target.value } : o))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input
                  value={organization.website ?? ""}
                  onChange={(e) =>
                    setOrganization((o) => (o ? { ...o, website: e.target.value } : o))
                  }
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Sector</Label>
                <Input
                  value={organization.sector}
                  onChange={(e) => setOrganization((o) => (o ? { ...o, sector: e.target.value } : o))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Grootte</Label>
                <Input
                  value={organization.size}
                  onChange={(e) => setOrganization((o) => (o ? { ...o, size: e.target.value } : o))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Beschrijving</Label>
              <Textarea
                rows={2}
                value={organization.description}
                onChange={(e) =>
                  setOrganization((o) => (o ? { ...o, description: e.target.value } : o))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Business model</Label>
              <Textarea
                rows={2}
                value={organization.businessModel}
                onChange={(e) =>
                  setOrganization((o) => (o ? { ...o, businessModel: e.target.value } : o))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kernproducten/-diensten</Label>
              <Textarea
                rows={2}
                value={organization.keyProducts}
                onChange={(e) =>
                  setOrganization((o) => (o ? { ...o, keyProducts: e.target.value } : o))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[var(--navy)]">Website-bronnen</CardTitle>
              <CardDescription>
                Ontvang voorstellen en keur websites goed als betrouwbare input.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => void suggestSources()} disabled={researching}>
              {researching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Nieuwe voorstellen
            </Button>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <p className="text-sm text-[var(--gray)]">Nog geen bronnen. Haal eerst voorstellen op.</p>
            ) : (
              <ul className="space-y-2">
                {sources.map((source) => (
                  <li key={source.id} className="rounded-lg border bg-white p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <a href={source.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-[var(--blue)] underline">
                        {source.title || source.url}
                      </a>
                      <Badge variant="outline">{source.status}</Badge>
                    </div>
                    <p className="mb-2 text-xs text-[var(--gray)]">{source.excerpt}</p>
                    <div className="flex gap-2">
                      {source.status === "proposed" ? (
                        <>
                          <Button size="sm" onClick={() => void updateSource(source.id, "approved")}>
                            <Check className="mr-2 h-4 w-4" />
                            Goedkeuren
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void updateSource(source.id, "rejected")}>
                            Afwijzen
                          </Button>
                        </>
                      ) : null}
                      <Button size="sm" variant="ghost" onClick={() => void removeSource(source.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Verwijderen
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
