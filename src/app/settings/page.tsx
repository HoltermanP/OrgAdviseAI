import { AppHeader } from "@/components/layout/header";
import { BrandStylesManager } from "@/components/settings/brand-styles-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Instellingen" },
        ]}
      />
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <BrandStylesManager />
        <Card>
          <CardHeader>
            <CardTitle className="text-[var(--navy)]">Account & techniek</CardTitle>
            <CardDescription>
              Organisatie- en accountvoorkeuren beheer je via Clerk (profielknop
              linksonder).
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[var(--gray-dark)]">
            <p>
              API-sleutels voor Claude en de database configureer je als omgevingsvariabelen
              op Vercel of in je lokale <code className="rounded bg-[var(--gray-light)] px-1">.env.local</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
