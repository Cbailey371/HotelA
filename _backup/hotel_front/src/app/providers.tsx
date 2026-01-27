"use client";
import { HERO_LOCALES } from "@/constants/common";
import { HeroUIProvider } from "@heroui/system";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { Toaster } from "react-hot-toast";

const Providers = ({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) => {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      basePath=""
    >
      <HeroUIProvider
        locale={HERO_LOCALES[locale as keyof typeof HERO_LOCALES]}
      >
        {/* <ToastProvider placement="bottom-center" /> */}
        <Toaster position="bottom-center" reverseOrder={false} />
        {children}
      </HeroUIProvider>
    </SessionProvider>
  );
};

export default Providers;
