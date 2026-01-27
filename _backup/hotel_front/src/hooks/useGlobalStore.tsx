import { useStore } from "@/store/globalState";
import useNotifications from "./useNotifications";

export const useGlobalStore = () => {
  const hooks = { ...useNotifications() };
  return {
    state: useStore(),
    hooks,
  };
};
