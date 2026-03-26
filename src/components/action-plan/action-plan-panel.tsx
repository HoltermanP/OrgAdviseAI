"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import type { SerializedActionPlanItem } from "@/lib/action-plan";
import { Check, Loader2, Pencil, Plus, Trash2, ListTodo } from "lucide-react";
import { toast } from "sonner";

type ActionPlanPanelProps = {
  projectId: string;
  /** Zonder header (ingesloten in project-tabs) */
  embed?: boolean;
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Laag",
  medium: "Gemiddeld",
  high: "Hoog",
};

const STATUS_LABEL: Record<string, string> = {
  proposed: "Voorstel",
  todo: "Te doen",
  in_progress: "Bezig",
  done: "Afgerond",
  cancelled: "Geannuleerd",
};

function priorityBadgeClass(p: string) {
  if (p === "high") return "border-red-200 bg-red-50 text-red-900";
  if (p === "low") return "border-slate-200 bg-slate-50 text-slate-800";
  return "border-amber-200 bg-amber-50 text-amber-950";
}

function statusBadgeClass(s: string) {
  if (s === "proposed")
    return "border-violet-300 bg-violet-50 text-violet-950";
  if (s === "done") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (s === "in_progress")
    return "border-[var(--blue)]/30 bg-[var(--blue-light)] text-[var(--navy)]";
  if (s === "cancelled") return "border-stone-200 bg-stone-100 text-stone-600";
  return "border-slate-200 bg-white text-slate-800";
}

function isoDateToInput(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

const emptyForm = {
  title: "",
  description: "",
  owner: "",
  priority: "medium",
  status: "todo",
  dueDate: "",
};

export function ActionPlanPanel({ projectId, embed }: ActionPlanPanelProps) {
  const [items, setItems] = useState<SerializedActionPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<SerializedActionPlanItem | null>(
    null,
  );
  const [createForm, setCreateForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/action-items`);
      const j = (await res.json()) as {
        items?: SerializedActionPlanItem[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Laden mislukt");
      setItems(j.items ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (editItem) {
      setEditForm({
        title: editItem.title,
        description: editItem.description,
        owner: editItem.owner,
        priority: editItem.priority,
        status: editItem.status,
        dueDate: isoDateToInput(editItem.dueAt),
      });
    }
  }, [editItem]);

  async function submitCreate() {
    if (!createForm.title.trim()) {
      toast.error("Titel is verplicht.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: createForm.title.trim(),
        description: createForm.description,
        owner: createForm.owner,
        priority: createForm.priority,
        status: createForm.status,
      };
      if (createForm.dueDate.trim()) {
        body.dueAt = createForm.dueDate;
      }
      const res = await fetch(`/api/projects/${projectId}/action-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { item?: SerializedActionPlanItem; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Opslaan mislukt");
      toast.success("Actie toegevoegd");
      setCreateOpen(false);
      setCreateForm({ ...emptyForm });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit() {
    if (!editItem) return;
    if (!editForm.title.trim()) {
      toast.error("Titel is verplicht.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: editForm.title.trim(),
        description: editForm.description,
        owner: editForm.owner,
        priority: editForm.priority,
        status: editForm.status,
        dueAt: editForm.dueDate.trim() ? editForm.dueDate : null,
      };
      const res = await fetch(
        `/api/projects/${projectId}/action-items/${editItem.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const j = (await res.json()) as { item?: SerializedActionPlanItem; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Bijwerken mislukt");
      toast.success("Actie bijgewerkt");
      setEditItem(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setSaving(false);
    }
  }

  async function confirmProposal(id: string) {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/projects/${projectId}/action-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "todo" }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Bevestigen mislukt");
      toast.success("Voorstel bevestigd als actie");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setConfirmingId(null);
    }
  }

  async function removeItem(id: string, options?: { proposal?: boolean }) {
    const msg = options?.proposal
      ? "Dit voorstel verwijderen? Je kunt het later niet terugzetten."
      : "Deze actie verwijderen?";
    if (!window.confirm(msg)) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/action-items/${id}`, {
        method: "DELETE",
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Verwijderen mislukt");
      toast.success("Actie verwijderd");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    }
  }

  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--gray)] max-w-xl">
          Na een voltooide analyse verschijnen alle aanbevelingen automatisch als{" "}
          <strong>voorstel</strong>. Bevestig ze om ze als actie te plannen (met
          eigenaar, prioriteit en deadline), of verwijder wat je niet nodig hebt.
        </p>
        <Button
          className="bg-[var(--blue)] hover:bg-[var(--blue)]/90"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe actie
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-[var(--gray)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-[var(--navy)]">Nog geen acties</CardTitle>
            <CardDescription>
              Start een analyse of voeg hieronder handmatig een actie toe.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-lg border bg-white p-4 shadow-sm ${
                item.status === "proposed"
                  ? "border-violet-200 border-dashed"
                  : "border-[var(--gray-light)]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-[var(--navy)]">{item.title}</h3>
                    <Badge
                      variant="outline"
                      className={priorityBadgeClass(item.priority)}
                    >
                      {PRIORITY_LABEL[item.priority] ?? item.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={statusBadgeClass(item.status)}
                    >
                      {STATUS_LABEL[item.status] ?? item.status}
                    </Badge>
                  </div>
                  {item.description ? (
                    <p className="whitespace-pre-wrap text-sm text-[var(--gray-dark)]">
                      {item.description}
                    </p>
                  ) : null}
                  {item.status === "proposed" ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        className="bg-[var(--blue)] hover:bg-[var(--blue)]/90"
                        disabled={confirmingId !== null}
                        onClick={() => void confirmProposal(item.id)}
                      >
                        {confirmingId === item.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Bevestigen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={confirmingId !== null}
                        onClick={() => void removeItem(item.id, { proposal: true })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Verwijderen
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--gray)]">
                    <span>
                      <span className="font-medium text-[var(--gray-dark)]">
                        Eigenaar:{" "}
                      </span>
                      {item.owner.trim() || "—"}
                    </span>
                    <span>
                      <span className="font-medium text-[var(--gray-dark)]">
                        Deadline:{" "}
                      </span>
                      {item.dueAt
                        ? new Date(item.dueAt).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                    {item.sourceAnalysisId != null ? (
                      <Link
                        href={`/projects/${projectId}/analyses/view/${item.sourceAnalysisId}`}
                        className="text-[var(--blue)] underline underline-offset-2"
                      >
                        Bronanalyse
                        {item.sourceRecommendationIndex != null
                          ? ` · aanbeveling ${item.sourceRecommendationIndex + 1}`
                          : ""}
                      </Link>
                    ) : null}
                  </div>
                </div>
                {item.status !== "proposed" ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      aria-label="Bewerken"
                      onClick={() => setEditItem(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      aria-label="Verwijderen"
                      onClick={() => void removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nieuwe actie</DialogTitle>
            <DialogDescription>
              Vul titel en eventueel eigenaar, prioriteit, status en deadline in.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ap-create-title">Titel</Label>
              <Input
                id="ap-create-title"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-create-desc">Omschrijving</Label>
              <Textarea
                id="ap-create-desc"
                rows={3}
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-create-owner">Eigenaar</Label>
              <Input
                id="ap-create-owner"
                placeholder="Naam of rol"
                value={createForm.owner}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, owner: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prioriteit</Label>
                <Select
                  value={createForm.priority}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({ ...f, priority: v ?? "medium" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Laag</SelectItem>
                    <SelectItem value="medium">Gemiddeld</SelectItem>
                    <SelectItem value="high">Hoog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={createForm.status}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({ ...f, status: v ?? "todo" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Te doen</SelectItem>
                    <SelectItem value="in_progress">Bezig</SelectItem>
                    <SelectItem value="done">Afgerond</SelectItem>
                    <SelectItem value="cancelled">Geannuleerd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-create-due">Deadline</Label>
              <Input
                id="ap-create-due"
                type="date"
                value={createForm.dueDate}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, dueDate: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter className="border-t-0 bg-transparent p-0">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuleren
            </Button>
            <Button disabled={saving} onClick={() => void submitCreate()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Actie bewerken</DialogTitle>
            <DialogDescription>Pas eigenaarschap en voortgang aan.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ap-edit-title">Titel</Label>
              <Input
                id="ap-edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-edit-desc">Omschrijving</Label>
              <Textarea
                id="ap-edit-desc"
                rows={3}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-edit-owner">Eigenaar</Label>
              <Input
                id="ap-edit-owner"
                value={editForm.owner}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, owner: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prioriteit</Label>
                <Select
                  value={editForm.priority}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, priority: v ?? "medium" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Laag</SelectItem>
                    <SelectItem value="medium">Gemiddeld</SelectItem>
                    <SelectItem value="high">Hoog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, status: v ?? "todo" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Te doen</SelectItem>
                    <SelectItem value="in_progress">Bezig</SelectItem>
                    <SelectItem value="done">Afgerond</SelectItem>
                    <SelectItem value="cancelled">Geannuleerd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-edit-due">Deadline</Label>
              <Input
                id="ap-edit-due"
                type="date"
                value={editForm.dueDate}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, dueDate: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter className="border-t-0 bg-transparent p-0">
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Sluiten
            </Button>
            <Button disabled={saving} onClick={() => void submitEdit()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (embed) {
    return <div className="space-y-6">{body}</div>;
  }

  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projecten", href: "/projects" },
          { label: "Project", href: `/projects/${projectId}` },
          { label: "Actieplan" },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${projectId}`}>Terug naar project</Link>
          </Button>
        }
      />
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-2 text-[var(--navy)]">
          <ListTodo className="h-6 w-6 text-[var(--blue)]" />
          <h1 className="text-xl font-semibold">Actieplan</h1>
        </div>
        {body}
      </div>
    </>
  );
}
