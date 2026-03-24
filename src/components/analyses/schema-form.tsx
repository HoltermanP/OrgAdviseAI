"use client";

import type { ModelInputSchema } from "@/data/advisory-models";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SchemaFormProps = {
  schema: ModelInputSchema;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
};

export function SchemaForm({
  schema,
  values,
  onChange,
  disabled,
}: SchemaFormProps) {
  const keys = Object.keys(schema.properties);

  return (
    <div className="grid gap-4">
      {keys.map((key) => {
        const prop = schema.properties[key];
        const id = `field-${key}`;
        const val = values[key] ?? "";
        const required = schema.required.includes(key);

        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={id}>
              {prop.title}
              {required ? " *" : ""}
            </Label>
            {prop.description ? (
              <p className="text-xs text-[var(--gray)]">{prop.description}</p>
            ) : null}
            {prop.format === "textarea" ? (
              <Textarea
                id={id}
                value={val}
                disabled={disabled}
                required={required}
                rows={4}
                onChange={(e) => onChange(key, e.target.value)}
              />
            ) : prop.type === "number" ? (
              <Input
                id={id}
                type="number"
                value={val}
                disabled={disabled}
                required={required}
                onChange={(e) => onChange(key, e.target.value)}
              />
            ) : (
              <Input
                id={id}
                type="text"
                value={val}
                disabled={disabled}
                required={required}
                onChange={(e) => onChange(key, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function buildInitialValues(schema: ModelInputSchema): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(schema.properties)) {
    out[key] = "";
  }
  return out;
}

export function valuesToInputData(
  schema: ModelInputSchema,
  values: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(schema.properties)) {
    const prop = schema.properties[key];
    const raw = values[key]?.trim() ?? "";
    if (prop.type === "number") {
      out[key] = raw === "" ? null : Number(raw);
    } else if (prop.type === "boolean") {
      out[key] = raw === "true";
    } else {
      out[key] = raw;
    }
  }
  return out;
}
