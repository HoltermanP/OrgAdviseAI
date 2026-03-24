import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { syncClerkUser } from "@/lib/auth-user";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
    }
    const user = await syncClerkUser();
    if (!user) {
      return NextResponse.json(
        { error: "Kon Clerk-profiel niet laden." },
        { status: 400 },
      );
    }
    return NextResponse.json({ user });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
