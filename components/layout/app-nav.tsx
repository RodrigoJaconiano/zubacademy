"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { appNavigation } from "@/lib/utils/navigation";

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  const currentValue =
    appNavigation.find((item) => pathname.startsWith(item.href))?.href ??
    "/dashboard";

  return (
    <div className="flex items-center gap-2">
      <nav className="hidden items-center gap-2 md:flex">
        {appNavigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition duration-200 ${
                isActive
                  ? "bg-blue-600 !text-white shadow-sm hover:bg-blue-700"
                  : "bg-transparent !text-black hover:bg-slate-100 !font-bold"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="md:hidden">
        <label htmlFor="mobile-navigation" className="sr-only">
          Navegação da plataforma
        </label>

        <select
          id="mobile-navigation"
          value={currentValue}
          onChange={(e) => router.push(e.target.value)}
          className="w-[170px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold !text-black shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {appNavigation.map((item) => (
            <option key={item.href} value={item.href}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}