"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

type OrganizationRow = {
  id: string;
  name: string;
  website: string | null;
  sector: string;
  size: string;
  description: string;
  updatedAt: string;
};

export default function OrganizationsPage() {
  const [items, setItems] = useState<OrganizationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    website: "",
    sector: "",
    size: "",
    description: "",
    businessModel: "",
    keyProducts: "",
    marketScope: "",
    headquarters: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organizations");
      const j = (await res.json()) as { organizations?: OrganizationRow[]; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Laden mislukt");
      setItems(j.organizations ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createOrganization(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = (await res.json()) as {
        organization?: { id: string };
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Aanmaken mislukt");
      toast.success("Organisatie aangemaakt");
      setOpen(false);
      setForm({
        name: "",
        website: "",
        sector: "",
        size: "",
        description: "",
        businessModel: "",
        keyProducts: "",
        marketScope: "",
        headquarters: "",
      });
      await load();
      if (j.organization?.id) {
        window.location.href = `/organizations/${j.organization.id}`;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Organisaties" },
        ]}
        actions={
          <Button className="bg-[var(--blue)] hover:bg-[var(--blue)]/90" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe organisatie
          </Button>
        }
      />

      <div className="flex-1 space-y-4 p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-16 text-[var(--gray)]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Nog geen organisaties</CardTitle>
              <CardDescription>
                Maak een organisatie aan en keur daarna website-bronnen goed voor modelinput.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setOpen(true)}>Start met organisatie</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((org) => (
              <Card key={org.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-[var(--navy)]">{org.name}</CardTitle>
                  <CardDescription>
                    {org.sector || "Sector onbekend"} · {org.size || "Grootte onbekend"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  {org.website ? (
                    <a href={org.website} target="_blank" rel="noreferrer" className="text-sm text-[var(--blue)] underline">
                      {org.website}
                    </a>
                  ) : (
                    <p className="text-sm text-[var(--gray)]">Nog geen website gekoppeld</p>
                  )}
                  <Button asChild variant="secondary">
                    <Link href={`/organizations/${org.id}`}>Beheren</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={createOrganization}>
            <DialogHeader>
              <DialogTitle>Nieuwe organisatie</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Naam *</Label>
                <Input
                  id="org-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-website">Website</Label>
                <Input
                  id="org-website"
                  placeholder="https://voorbeeld.nl"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="org-sector">Sector</Label>
                  <Input
                    id="org-sector"
                    value={form.sector}
                    onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-size">Grootte</Label>
                  <Input
                    id="org-size"
                    value={form.size}
                    onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-description">Beschrijving</Label>
                <Textarea
                  id="org-description"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-model">Business model</Label>
                <Textarea
                  id="org-model"
                  rows={2}
                  value={form.businessModel}
                  onChange={(e) => setForm((f) => ({ ...f, businessModel: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-products">Kernproducten/-diensten</Label>
                <Textarea
                  id="org-products"
                  rows={2}
                  value={form.keyProducts}
                  onChange={(e) => setForm((f) => ({ ...f, keyProducts: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="org-market">Markt/regio</Label>
                  <Input
                    id="org-market"
                    value={form.marketScope}
                    onChange={(e) => setForm((f) => ({ ...f, marketScope: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-hq">Hoofdkantoor</Label>
                  <Input
                    id="org-hq"
                    value={form.headquarters}
                    onChange={(e) => setForm((f) => ({ ...f, headquarters: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opslaan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
