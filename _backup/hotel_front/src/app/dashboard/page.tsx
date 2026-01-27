import Link from "next/link";
import React from "react";

const LINKS = [
  {
    href: "/users",
    icon: "icon-[fa6-solid--users]",
    label: "Usuarios",
  },
  {
    href: "/locations",
    icon: "icon-[ci--location]",
    label: "Ubicaciones",
  },
  {
    href: "/providers",
    icon: "icon-[famicons--people]",
    label: "Proveedores",
  },
  {
    href: "/assets",
    icon: "icon-[vs--tables]",
    label: "Activos",
  },
  {
    href: "/replacements",
    icon: "icon-[fa6-solid--gears]",
    label: "Repuestos",
  },
  {
    href: "/maintenance",
    icon: "icon-[mdi--tools]",
    label: "Mantenimiento",
  },
  {
    href: "/schedule",
    icon: "icon-[akar-icons--schedule]",
    label: "Agenda",
  },
];

const page = () => {
  const SectionCard = ({
    icon,
    title,
    href,
  }: {
    title: string;
    icon: string;
    href: string;
  }) => {
    return (
      <Link
        href={href}
        className="flex flex-col gap-4 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-all border border-gray-200 justify-center items-center h-40 lg:h-56"
      >
        <span className={icon} />
        <h2 className="text-2xl md:text-3xl">{title}</h2>
      </Link>
    );
  };
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-10">
      {LINKS.map((link) => {
        return (
          <SectionCard
            key={link.href}
            icon={`${link.icon} text-5xl md:text-7xl text-primary`}
            title={link.label}
            href={`/dashboard${link.href}`}
          />
        );
      })}
    </div>
  );
};

export default page;
