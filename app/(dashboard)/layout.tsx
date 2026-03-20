"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Code2,
  Gauge,
  Search,
  AlertTriangle,
  FileCode,
  BarChart3,
  Lightbulb,
  Settings,
  Menu,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

const analysisItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "Clases CSS", icon: Code2, href: "/classes" },
  { label: "Performance", icon: Gauge, href: "/performance" },
  { label: "SEO & Meta", icon: Search, href: "/seo" },
  { label: "Problemas", icon: AlertTriangle, href: "/issues" },
  { label: "Custom Code", icon: FileCode, href: "/custom-code" },
  { label: "Estadisticas", icon: BarChart3, href: "/statistics" },
] as const;

const toolItems = [
  { label: "Recomendaciones", icon: Lightbulb, href: "/recommendations" },
  { label: "Configuracion", icon: Settings, href: "/settings" },
] as const;

const allNavItems = [...analysisItems, ...toolItems];

function getPageTitle(pathname: string): string {
  const item = allNavItems.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  return item?.label ?? "Panel de Monitoreo";
}

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: { label: string; icon: typeof LayoutDashboard; href: string };
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-500/10 text-blue-400"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-500" />
      )}
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col gap-1 px-2">
      <span className="mb-1 mt-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Analisis
      </span>
      {analysisItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          isActive={isActive(item.href)}
          onNavigate={onNavigate}
        />
      ))}

      <div className="mx-3 my-2 border-t border-white/5" />

      <span className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Herramientas
      </span>
      {toolItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          isActive={isActive(item.href)}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);

  function toggleTheme() {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    router.push("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d1526]">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/5 bg-[#0A1628] lg:flex">
        {/* Gradient top line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 to-purple-500" />
        <div className="flex h-14 items-center gap-2.5 border-b border-white/5 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-black text-white shadow-lg shadow-blue-500/20">
            R
          </div>
          <span className="text-base font-bold text-white">Ripio Monitor</span>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav />
        </div>
        <div className="border-t border-white/5 px-4 py-3">
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            v1.0
          </span>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#0A1628]/80 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 lg:hidden"
                  />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-60 border-white/5 bg-[#0A1628] p-0"
              >
                <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 to-purple-500" />
                <SheetHeader className="border-b border-white/5">
                  <SheetTitle className="flex items-center gap-2.5 text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-black text-white shadow-lg shadow-blue-500/20">
                      R
                    </div>
                    Ripio Monitor
                  </SheetTitle>
                </SheetHeader>
                <div className="py-3">
                  <SidebarNav onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-sm font-semibold text-white lg:text-base">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-slate-400 hover:text-white"
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      <Toaster />
    </div>
  );
}
