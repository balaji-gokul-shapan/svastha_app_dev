"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import { FullScreenLoader } from "@/components/ui/global-loader";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { clearAuthSession } from "@/lib/features/auth-slice";

import { AppBreadcrumb } from "./app-breadcrumb";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

const CHROMELESS_ROUTES = ["/login", "/register"];

const subscribeNoop = () => () => {};

export function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state) => state.auth?.isAuthenticated === true,
  );
  const hideChrome = CHROMELESS_ROUTES.some((route) => pathname?.startsWith(route));

  // "Are we on the client?" without a setState-in-effect: the server snapshot is
  // false so the server render and the hydrating render agree on the loader,
  // then React switches to the client snapshot and the real UI mounts.
  const isClient = React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  React.useEffect(() => {
    if (hideChrome || isAuthenticated) {
      return;
    }

    // proxy.js lets every request through while the `svastha-auth` COOKIE
    // exists, and bounces /login back to "/" for as long as it does. The
    // session itself (tokens, user) lives in sessionStorage, which is PER TAB —
    // so a new tab, or cleared site data, leaves "cookie yes / session no".
    // Clearing the cookie here is what stops that ping-ponging / -> /login -> /
    // behind a blank page.
    dispatch(clearAuthSession());
    router.replace("/login");
  }, [dispatch, hideChrome, isAuthenticated, router]);

  if (hideChrome) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (!isClient || !isAuthenticated) {
    return (
      <FullScreenLoader
        label={isAuthenticated ? "Loading your dashboard..." : "Restoring your session..."}
      />
    );
  }

  return (
    <SidebarProvider className="min-h-screen bg-background">
      <Sidebar />

      {/*
       * Mobile only: opens the off-canvas sidebar sheet.
       */}
      <SidebarTrigger className="fixed left-3 top-4 z-50 md:hidden" />

      {/*
       * `min-w-0` is required here: this is a flex child of the sidebar row,
       * so without it the column keeps `min-width: auto` and any wide child
       * (e.g. a data table on mobile) stretches the whole page instead of
       * scrolling inside its own container.
       */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar title="Dashboard" />
        <AppBreadcrumb />
        <main className="min-w-0 flex-1 p-4 py-1.5 sm:px-6">{children}</main>
      </div>
    </SidebarProvider>
  );
}