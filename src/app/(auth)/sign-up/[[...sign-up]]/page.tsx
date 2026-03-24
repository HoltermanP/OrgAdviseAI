import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--gray-light)] px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--navy)]">OrgAdvisor AI</h1>
        <p className="mt-1 text-sm text-[var(--gray)]">
          Maak een account aan om te starten
        </p>
      </div>
      <SignUp
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
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
