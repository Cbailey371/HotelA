import {
  getNotifications,
  deleteNotification as deleteNotificationAction,
  updateNotification,
} from "@/lib/actions";
import { useStore } from "@/store/globalState";

const useNotifications = () => {
  const { setNotifications, notifications } = useStore();

  const getAllNotifications = async ({ hotelId }: { hotelId?: string }) => {
    if (!hotelId) return;
    const response = await getNotifications({
      perPage: 400,
      where: [
        {
          key: "hotelId",
          value: hotelId,
          operator: "empty",
        },
        {
          key: "read",
          value: "false",
          valueType: "boolean",
        },
      ],
      orderBy: "id: desc",
    });
    if (!response.data?.length || !response.meta) return;
    setNotifications(response);
    return response;
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      if (!!notifications?.data && !!notifications.meta) {
        const newNotifications = notifications?.data?.filter(
          (n) => n.id !== notificationId
        );
        const newMeta = {
          ...notifications?.meta,
          total: notifications?.meta?.total - 1,
        };
        setNotifications({
          data: newNotifications,
          meta: newMeta,
        });
      }
      const response = await deleteNotificationAction(notificationId);

      if (!response) throw new Error("Error deleting notification");
      return response;
    } catch (e) {
      if (!!notifications?.data && !!notifications.meta) {
        setNotifications(notifications);
      }
    }
  };

  const readNotification = async (notificationId: string) => {
    try {
      if (!!notifications?.data && !!notifications.meta) {
        const newNotifications = notifications?.data?.filter(
          (n) => n.id !== notificationId
        );
        const newMeta = {
          ...notifications?.meta,
          total: notifications?.meta?.total - 1,
        };
        setNotifications({
          data: newNotifications,
          meta: newMeta,
        });
      }
      const response = await updateNotification(notificationId, {
        read: true,
      });
      if (!response) throw new Error("Error reading notification");
      return response;
    } catch (e) {
      if (!!notifications?.data && !!notifications.meta) {
        setNotifications(notifications);
      }
    }
  };

  return {
    getAllNotifications,
    deleteNotification,
    readNotification,
  };
};

export default useNotifications;
