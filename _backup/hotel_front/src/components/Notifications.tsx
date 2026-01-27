"use client";

import { useGlobalStore } from "@/hooks/useGlobalStore";
import { Divider } from "@heroui/divider";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { useSession } from "next-auth/react";
import { memo, useEffect, useMemo } from "react";
import { Badge } from "@heroui/badge";

const Notifications = () => {
  const {
    state: { notifications },
    hooks: { getAllNotifications, deleteNotification, readNotification },
  } = useGlobalStore();

  const { data: session } = useSession();

  const fetchNotifications = useMemo(
    () => async () => {
      await getAllNotifications({
        hotelId: session?.user?.hotelId,
      });
    },
    [notifications, session]
  );

  useEffect(() => {
    if (!session?.user?.hotelId) return;
    fetchNotifications();
  }, [session]);

  const handleReadNotification = async (id: string) => {
    await readNotification(id);
  };

  const notificationLength = notifications?.data?.length || 0;

  return (
    <>
      <Popover placement="bottom-end" showArrow={true}>
        <PopoverTrigger onClick={() => fetchNotifications()}>
          <div className="mt-2 w-8">
            <Badge
              // color="primary"
              showOutline={false}
              content={notifications?.meta?.total || 0}
              shape="circle"
              className={
                notifications?.meta?.total || 0 > 0 ? "animate-pulse" : ""
              }
            >
              <span className="icon-[mdi--bell] text-2xl text-white cursor-pointer" />
            </Badge>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 md:w-96 overflow-auto py-4">
          <div className="max-h-[360px] gap-4 w-full">
            {!!notificationLength ? (
              notifications?.data?.map((notification, index) => (
                <div key={notification.id}>
                  <div className="flex flex-row gap-2 justify-between items-center">
                    <div className="flex flex-col flex-grow max-w-[calc(100%-0.75rem)] select-none">
                      <p className="font-semibold line-clamp-2">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 overflow-hidden overflow-ellipsis whitespace-normal line-clamp-4">
                        {notification.message}
                      </p>
                    </div>
                    <span
                      onClick={() => handleReadNotification(notification.id)}
                      className="icon-[material-symbols--close] text-xl cursor-pointer hover:scale-125 transition-all flex-shrink-0"
                    />
                  </div>
                  {index < notificationLength - 1 && (
                    <Divider className="my-2 w-full" />
                  )}
                </div>
              ))
            ) : (
              <div role="button">
                <div className="flex flex-col">No hay notificaciones</div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default memo(Notifications);
