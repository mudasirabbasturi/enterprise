import { notification } from "antd";
import { useEffect } from "react";
import { usePage } from "@inertiajs/react";

const Messages = () => {
  const { flash, errors } = usePage().props;
  const [api, contextHolder] = notification.useNotification();

  // Handle success messages
  useEffect(() => {
    if (flash?.message) {
      api.success({
        message: "Success",
        description: flash.message,
        placement: "topRight",
      });
    }
  }, [flash?.message]);

  // Handle error messages
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, messages]) => {
        const errorText = Array.isArray(messages)
          ? messages.join(", ")
          : messages;
        api.error({
          message: "Validation Error",
          description: errorText,
          placement: "topRight",
        });
      });
    }
  }, [errors]);

  return contextHolder;
};

export default Messages;
