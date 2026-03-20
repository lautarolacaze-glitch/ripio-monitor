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
  Monitor,
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

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "Clases CSS", icon: Code2, href: "/classes" },
  { label: "Performance", icon: Gauge, href: "/performance" },
  { label: "SEO & Meta", icon: Search, href: "/seo" },
  { label: "Problemas", icon: AlertTriangle, href: "/issues" },
  { label: "Custom Code", icon: FileCode, href: "/custom-code" },
  { label: "Estadisticas", icon: BarChart3, href: "/statistics" },
  { label: "Recomendaciones", icon: Lightbulb, href: "/recommendations" },
  { label: "Configuracion", icon: Settings, href: "/settings" },
] as const;

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-2">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-500/15 text-blue-400"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <div className="flex h-14 items-center gap-2 border-b border-white/5 px-4">
          <Monitor className="h-5 w-5 text-blue-400" />
          <span className="text-base font-bold text-white">Ripio Monitor</span>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav />
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
                <SheetHeader className="border-b border-white/5">
                  <SheetTitle className="flex items-center gap-2 text-white">
                    <Monitor className="h-5 w-5 text-blue-400" />
                    Ripio Monitor
                  </SheetTitle>
                </SheetHeader>
                <div className="py-3">
                  <SidebarNav onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-sm font-semibold text-white lg:text-base">
              Panel de Monitoreo
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
