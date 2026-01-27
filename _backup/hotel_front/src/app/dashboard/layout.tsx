import SideNav from "@/components/SideNav";
import { headers } from "next/headers";
import React from "react";

const isMobileUserAgent = (userAgent: string) => {
  return /iPhone|iPad|iPod|Android/i.test(userAgent);
};

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const headersList = await headers();
  const isMobile = isMobileUserAgent(headersList.get("user-agent") || "");
  return (
    <>
      <SideNav isMobile={isMobile} />
      <div className="p-4 sm:ml-56 pt-20">{children}</div>
    </>
  );
};

export default Layout;
