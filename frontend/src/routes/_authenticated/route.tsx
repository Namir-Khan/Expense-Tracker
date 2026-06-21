import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("auth-token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppShell,
});