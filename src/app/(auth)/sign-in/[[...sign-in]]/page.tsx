import { SignIn } from "@clerk/nextjs";
import { BrandLogo } from "@/components/brand/brand-logo";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--gray-light)] px-4">
      <div className="mb-8 text-center">
        <BrandLogo className="justify-center" />
        <p className="mt-1 text-sm text-[var(--gray)]">Log in om verder te gaan</p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "border border-[var(--gray-light)] shadow-lg",
            headerTitle: "text-[var(--navy)]",
            formButtonPrimary:
              "bg-[var(--navy)] hover:bg-[var(--navy)]/90 text-sm normal-case",
          },
          variables: {
            colorPrimary: "#0F172A",
            colorTextOnPrimaryBackground: "#ffffff",
            borderRadius: "0.625rem",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
