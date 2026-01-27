"use client";
import { useRouter } from "next/navigation";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";

//Componente diseñado para enviarles una arreglo de paginas generando un breadcrumb
export default function BreadCrumb({
  pages,
  className = "my-6",
}: {
  pages: Array<{ name: string; href: string }>;
  className?: string;
}) {
  const router = useRouter();
  return (
    <Breadcrumbs className={className} size="lg">
      <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
      {pages.map((page, index) => {
        if (index === pages.length - 2) {
          return (
            <BreadcrumbItem
              key={page.name + index}
              onClick={() => router.back()}
            >
              {page.name}
            </BreadcrumbItem>
          );
        }
        return (
          <BreadcrumbItem
            href={page.href && `/dashboard${page.href}`}
            key={page.name + index}
          >
            {page.name}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumbs>
  );
}
