"use client";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import React from "react";
import { signOut, useSession } from "next-auth/react";
import ProfileImage from "./ProfileImage";

const UserAvatar = () => {
  const { data: session } = useSession();
  //   const t = useTranslations("navbar");
  return (
    <Dropdown placement="bottom-start">
      <DropdownTrigger className="cursor-pointer">
        <div>
          <ProfileImage
            name={`${session?.user?.firstName || "John"} ${
              session?.user?.lastName || "Doe"
            }`}
            size={40}
          />
        </div>
      </DropdownTrigger>
      <DropdownMenu aria-label="User Actions" variant="flat">
        <DropdownItem key="profile" className="h-10 gap-2">
          <p className="font-bold">
            {session?.user?.email || "j.doe@gmail.com"}
          </p>
        </DropdownItem>
        <DropdownItem onPress={() => signOut()} key="logout" color="danger">
          {/* {t("logout")} */}
          Logout
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default UserAvatar;
