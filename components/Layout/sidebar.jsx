'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  BsFillHousesFill,
} from "react-icons/bs";
import {
  HiDocumentReport,
} from "react-icons/hi";
import { IoMapSharp } from "react-icons/io5";
import { FaExclamationTriangle, FaUserShield } from "react-icons/fa";
import { MdSpaceDashboard } from "react-icons/md";
import { useAuth } from "@/context/authContext";
import useIsMobile from "@/hooks/useMobile";

const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: MdSpaceDashboard,
        allowedRoles: ["Brgy-Secretary", "MDRRMC-Personnel"],
      },
      {
        href: "/household",
        label: "Households",
        icon: BsFillHousesFill,
        allowedRoles: ["Brgy-Secretary", "MDRRMC-Personnel", "MDRRMC-Admin"],
      },
      {
        href: "/map",
        label: "Maps",
        icon: IoMapSharp,
        allowedRoles: ["MDRRMC-Admin", "MDRRMC-Personnel", "Brgy-Secretary"],
      },
      {
        href: "/reports",
        label: "Reports",
        icon: HiDocumentReport,
        allowedRoles: ["MDRRMC-Personnel", "Brgy-Secretary"],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        href: "/hazards",
        label: "Hazards",
        icon: FaExclamationTriangle,
        allowedRoles: ["MDRRMC-Admin"],
      },
      {
        href: "/users",
        label: "User Management",
        icon: FaUserShield,
        allowedRoles: ["MDRRMC-Admin"],
      },
    ],
  },
];

function getRoleBadgeStyle(role) {
  switch ((role || "").toLowerCase()) {
    case "mdrrmc-admin":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "mdrrmc-personnel":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "brgy-secretary":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border border-slate-200";
  }
}

export default function Sidebar({ sidebarOpen }) {
  const pathname = usePathname().toLowerCase();
  const { profile, role, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) return null;

  const effectiveSidebarOpen = isMobile ? false : sidebarOpen;

  const isAllowed = (allowedRoles = []) =>
    allowedRoles.map((r) => r.toLowerCase()).includes(role?.toLowerCase());

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isAllowed(item.allowedRoles)),
  })).filter((section) => section.items.length > 0);

  const displayName =
    profile?.name ||
    profile?.displayName ||
    profile?.fullName ||
    "User";

  const profileInitial = displayName?.charAt(0)?.toUpperCase() || "U";

  return (
    <aside
      className={`
        flex h-full flex-col border-r border-slate-200 bg-white shadow-sm
        transition-all duration-300 ease-in-out
        ${effectiveSidebarOpen ? "w-[272px]" : "w-[72px]"}
      `}
    >
      {/* Header */}
      <div className="border-b border-slate-200 px-3 py-4">
        <div
          className={`
            flex items-center
            ${effectiveSidebarOpen ? "gap-3" : "justify-center"}
          `}
        >
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 shadow-sm">
            <Image
              src="/clarinLogo.png"
              alt="LUWAS Logo"
              width={48}
              height={48}
              className="h-10 w-10 object-contain"
              priority
            />
          </div>

          <div
            className={`
              overflow-hidden transition-all duration-300
              ${effectiveSidebarOpen ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0"}
            `}
          >
            <h1 className="truncate text-base font-bold tracking-wide text-slate-800">
              LUWAS
            </h1>
            <p className="truncate text-xs text-slate-500">
              Risk Mapping & Alert System
            </p>
          </div>
        </div>

        <div
          className={`
            mt-4 overflow-hidden transition-all duration-300
            ${effectiveSidebarOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}
          `}
        >
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Access Role
            </p>
            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleBadgeStyle(
                role
              )}`}
            >
              {role || "No role"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="flex flex-col gap-5">
          {visibleSections.map((section) => (
            <div key={section.title}>
              <div
                className={`
                  mb-2 overflow-hidden transition-all duration-300
                  ${effectiveSidebarOpen ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}
                `}
              >
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {section.title}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    pathname === href.toLowerCase() ||
                    pathname.startsWith(`${href.toLowerCase()}/`);

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`
                        group relative flex items-center rounded-2xl px-2 py-2.5
                        transition-all duration-200
                        ${
                          effectiveSidebarOpen
                            ? "justify-start"
                            : "justify-center"
                        }
                        ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                            : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
                        }
                      `}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-600" />
                      )}

                      <span
                        className={`
                          relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                          transition-all duration-200
                          ${
                            isActive
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                          }
                        `}
                      >
                        <Icon size={20} />
                      </span>

                      <span
                        className={`
                          ml-3 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300
                          ${
                            effectiveSidebarOpen
                              ? "max-w-[160px] opacity-100"
                              : "max-w-0 opacity-0"
                          }
                        `}
                      >
                        {label}
                      </span>

                      {!effectiveSidebarOpen && (
                        <span className="pointer-events-none absolute left-full z-30 ml-3 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-all duration-200 group-hover:opacity-100">
                          {label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-3 py-4">
        <div
          className={`
            flex items-center rounded-2xl bg-slate-50 p-2.5 transition-all duration-300
            ${effectiveSidebarOpen ? "gap-3" : "justify-center"}
          `}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
            {profile?.profilePhoto ? (
              <Image
                src={profile.profilePhoto}
                alt="Profile"
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-emerald-700">
                {profileInitial}
              </span>
            )}
          </div>

          <div
            className={`
              overflow-hidden transition-all duration-300
              ${effectiveSidebarOpen ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0"}
            `}
          >
            <p className="truncate text-sm font-semibold text-slate-800">
              {displayName}
            </p>
            <p className="truncate text-xs text-slate-500">
              {role || "System User"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

