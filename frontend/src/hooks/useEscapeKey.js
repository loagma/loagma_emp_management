import { useEffect } from "react";

export default function useEscapeKey(handler) {
  useEffect(() => {
    const listener = (event) => {
      if (event.key === "Escape") {
        handler(event);
      }
    };

    document.addEventListener("keydown", listener);

    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, [handler]);
}
