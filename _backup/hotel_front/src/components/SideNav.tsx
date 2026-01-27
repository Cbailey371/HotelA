"use client";
import { useGlobalStore } from "@/hooks/useGlobalStore";
import React, { useEffect } from "react";
import UserAvatar from "./UserAvatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Notifications from "./Notifications";

const LINKS = [
  {
    href: "/dashboard",
    icon: "icon-[typcn--home]",
    label: "Inicio",
  },
  {
    href: "/dashboard/users",
    icon: "icon-[fa6-solid--users]",
    label: "Usuarios",
  },
  {
    href: "/dashboard/locations",
    icon: "icon-[ci--location]",
    label: "Ubicaciones",
  },
  {
    href: "/dashboard/providers",
    icon: "icon-[famicons--people]",
    label: "Proveedores",
  },
  {
    href: "/dashboard/technicians",
    icon: "icon-[fa6-solid--screwdriver]",
    label: "Técnicos",
  },
  {
    href: "/dashboard/assets",
    icon: "icon-[vs--tables]",
    label: "Activos",
  },
  {
    href: "/dashboard/replacements",
    icon: "icon-[fa6-solid--gears]",
    label: "Repuestos",
  },
  {
    href: "/dashboard/maintenance",
    icon: "icon-[mdi--tools]",
    label: "Mantenimiento",
  },
  {
    href: "/dashboard/schedule",
    icon: "icon-[akar-icons--schedule]",
    label: "Agenda",
  },
];

const SideNav = ({ isMobile }: { isMobile: boolean }) => {
  const {
    state: { openSideNav, setOpenSideNav },
  } = useGlobalStore();

  const pathname = usePathname();

  useEffect(() => {
    if (openSideNav && isMobile) {
      setOpenSideNav(false);
    }
  }, [pathname]);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-primary border-b border-gray-200">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start rtl:justify-end">
              <button
                type="button"
                onClick={() => setOpenSideNav(!openSideNav)}
                className="inline-flex items-center p-2 text-sm text-white rounded-lg sm:hidden"
              >
                <span className="sr-only">Open sidebar</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    fillRule="evenodd"
                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                  ></path>
                </svg>
              </button>
              <Link href="/dashboard" className="flex ms-2 md:me-24">
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-white">
                  Hotel Andros
                </span>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="flex items-center ms-3 gap-4">
                <Notifications />
                <UserAvatar />
              </div>
            </div>
          </div>
        </div>
      </nav>
      {openSideNav && (
        <div
          className="h-screen w-scren absolute md:hidden z-30 inset-0 opacity-20 bg-black transition-all "
          onClick={() => setOpenSideNav(!openSideNav)}
        ></div>
      )}
      <aside
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-40 w-52 h-screen pt-20 transition-transform -translate-x-full bg-primary border-r border-gray-200 sm:translate-x-0 ${
          openSideNav ? "translate-x-0" : ""
        }`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 pb-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            {LINKS.map((link) => {
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center p-2 text-white rounded-lg hover:translate-x-2 transition-all"
                  >
                    <span className={`${link.icon} text-white`} />
                    <span className="flex-1 ms-3 whitespace-nowrap">
                      {link.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default SideNav;
