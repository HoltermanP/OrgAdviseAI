"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ADVISORY_MODEL_BY_ID } from "@/data/advisory-models";
import { AppHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import {
  SchemaForm,
  buildInitialValues,
  valuesToInputData,
} from "@/components/analyses/schema-form";
import { StreamingResult } from "@/components/analyses/streaming-result";
import type { AnalysisOutput } from "@/lib/analysis-output";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function RunAnalysisPage() {
  const params = useParams();
  const projectId = String(params.id);
  const modelId = String(params.modelId);
  const model = ADVISORY_MODEL_BY_ID[modelId];

  const initialValues = useMemo(
    () => (model ? buildInitialValues(model.inputSchema) : {}),
    [model],
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  useEffect(() => {
    setValues(buildInitialValues(model.inputSchema));
  }, [model]);
  const [streamingText, setStreamingText] = useState("");
  const [parsed, setParsed] = useState<AnalysisOutput | null>(null);
  const [complete, setComplete] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!model) {
    return (
      <>
        <AppHeader
          items={[
            { label: "Project", href: `/projects/${projectId}` },
            { label: "Onbekend model" },
          ]}
        />
        <div className="p-6">
          <p className="text-[var(--gray)]">Dit model bestaat niet.</p>
          <Button asChild className="mt-4">
            <Link href={`/projects/${projectId}/analyses/new`}>Terug</Link>
          </Button>
        </div>
      </>
    );
  }

  function setField(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true);
    setStreamingText("");
    setParsed(null);
    setComplete(false);
    setError(null);
    const inputData = valuesToInputData(model.inputSchema, values);
    try {
      const res = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          modelId: model.id,
          inputData,
          stream: true,
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Analyse mislukt");
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Geen stream");
      let buf = "";
      let sawComplete = false;
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          try {
            const evt = JSON.parse(payload) as {
              type: string;
              text?: string;
              output?: AnalysisOutput;
              message?: string;
            };
            if (evt.type === "chunk" && evt.text) {
              acc += evt.text;
              setStreamingText((t) => t + evt.text);
            }
            if (evt.type === "complete" && evt.output) {
              setParsed(evt.output);
              setComplete(true);
              sawComplete = true;
            }
            if (evt.type === "error") {
              setError(evt.message ?? "Fout");
            }
          } catch {
            /* ignore partial json */
          }
        }
      }
      if (!sawComplete && !acc) {
        setError("Geen antwoord ontvangen. Controleer je API-sleutel en probeer opnieuw.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fout");
      setError(err instanceof Error ? err.message : "Fout");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projecten", href: "/projects" },
          { label: "Project", href: `/projects/${projectId}` },
          { label: model.name },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${projectId}/analyses/new`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Modellen
            </Link>
          </Button>
        }
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CategoryBadge category={model.category} />
              <CardTitle className="text-[var(--navy)]">{model.name}</CardTitle>
              <CardDescription>{model.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--gray-dark)]">
              <p className="font-medium text-[var(--navy)]">Wanneer gebruiken</p>
              <p>{model.whenToUse}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[var(--navy)]">Invoer</CardTitle>
              <CardDescription>Vul de velden in om de analyse te starten.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <SchemaForm
                  schema={model.inputSchema}
                  values={values}
                  onChange={setField}
                  disabled={running}
                />
                <Button
                  type="submit"
                  disabled={running}
                  className="w-full bg-[var(--blue)] hover:bg-[var(--blue)]/90"
                >
                  {running ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bezig…
                    </>
                  ) : (
                    "Start analyse (streaming)"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {(streamingText || complete || error) && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-[var(--navy)]">Resultaat</h2>
            <StreamingResult
              streamingText={streamingText}
              isComplete={complete}
              parsedOutput={parsed}
              error={error}
            />
          </section>
        )}
      </div>
    </>
  );
}
