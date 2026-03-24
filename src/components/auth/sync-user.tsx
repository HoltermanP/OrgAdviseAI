"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export function SyncUser() {
  const { isSignedIn, isLoaded } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || done.current) return;
    done.current = true;
    void fetch("/api/users/sync", { method: "POST" }).catch(() => {
      done.current = false;
    });
  }, [isLoaded, isSignedIn]);

  return null;
}
