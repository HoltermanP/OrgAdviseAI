"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/lib/brand";

type BrandStyleRow = {
  id: string;
  name: string;
  accentColor: string;
  secondaryColor: string;
  mutedColor: string;
  logoUrl: string | null;
  footerText: string;
};

const emptyForm = {
  name: "",
  accentColor: BRAND.colors.blue,
  secondaryColor: BRAND.colors.navy,
  mutedColor: BRAND.colors.mutedBlue,
  logoUrl: BRAND.logoUrl,
  footerText: "",
};

type BrandStyleForm = {
  name: string;
  accentColor: string;
  secondaryColor: string;
  mutedColor: string;
  logoUrl: string;
  footerText: string;
};

export function BrandStylesManager() {
  const [list, setList] = useState<BrandStyleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BrandStyleForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brand-styles");
      const j = (await res.json()) as {
        brandStyles?: BrandStyleRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Laden mislukt");
      setList(j.brandStyles ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createStyle() {
    if (!form.name.trim()) {
      toast.error("Geef een naam op.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/brand-styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          accentColor: form.accentColor,
          secondaryColor: form.secondaryColor,
          mutedColor: form.mutedColor,
          logoUrl: form.logoUrl.trim() || null,
          footerText: form.footerText.trim(),
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Aanmaken mislukt");
      setForm(emptyForm);
      toast.success("Huisstijl toegevoegd");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStyle(id: string) {
    if (!confirm("Deze huisstijl verwijderen? Projecten krijgen geen koppeling meer.")) {
      return;
    }
    try {
      const res = await fetch(`/api/brand-styles/${id}`, { method: "DELETE" });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Verwijderen mislukt");
      toast.success("Verwijderd");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--navy)]">Huisstijlen</CardTitle>
        <CardDescription>
          Kleuren, logo-URL en voettekst voor PDF-export. Koppel een huisstijl per project op
          de projectpagina.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4 rounded-lg border border-dashed border-[var(--gray-light)] p-4">
          <p className="text-sm font-medium text-[var(--navy)]">Nieuwe huisstijl</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bs-name">Naam</Label>
              <Input
                id="bs-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Bijv. Acme corporate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bs-accent">Accentkleur</Label>
              <Input
                id="bs-accent"
                type="color"
                className="h-10 w-full cursor-pointer"
                value={form.accentColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accentColor: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bs-secondary">Primaire tekstkleur</Label>
              <Input
                id="bs-secondary"
                type="color"
                className="h-10 w-full cursor-pointer"
                value={form.secondaryColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, secondaryColor: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bs-muted">Secundaire / muted</Label>
              <Input
                id="bs-muted"
                type="color"
                className="h-10 w-full cursor-pointer"
                value={form.mutedColor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mutedColor: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bs-logo">Logo-URL (optioneel, https)</Label>
              <Input
                id="bs-logo"
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bs-footer">Voettekst PDF (optioneel)</Label>
              <Input
                id="bs-footer"
                value={form.footerText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, footerText: e.target.value }))
                }
                placeholder="Leeg laten voor standaard AI-Group-voet"
              />
            </div>
          </div>
          <Button
            type="button"
            className="bg-[var(--navy)] text-white hover:bg-[var(--navy)]/90"
            disabled={saving}
            onClick={() => void createStyle()}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Toevoegen
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--navy)]">Jouw huisstijlen</p>
          {loading ? (
            <div className="flex justify-center py-8 text-[var(--gray)]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <p className="text-sm text-[var(--gray)]">
              Nog geen huisstijlen. Voeg er een toe om per project te kunnen kiezen.
            </p>
          ) : (
            <ul className="space-y-2">
              {list.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--gray-light)] bg-white p-3"
                >
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-medium text-[var(--navy)]">{s.name}</span>
                    <span className="flex items-center gap-1 text-xs text-[var(--gray)]">
                      <span
                        className="inline-block h-4 w-4 rounded border"
                        style={{ backgroundColor: s.accentColor }}
                        title="Accent"
                      />
                      <span
                        className="inline-block h-4 w-4 rounded border"
                        style={{ backgroundColor: s.secondaryColor }}
                        title="Tekst"
                      />
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => void deleteStyle(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
