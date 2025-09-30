import { useState } from "react";
import { Button } from "@/components";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

interface CheckoutResponse {
  success?: boolean;
  checkout_url?: string;
  error?: string;
}
export const GetLicense = ({
  setState,
}: {
  setState?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleGetLicenseKey = async () => {
    setIsCheckoutLoading(true);

    try {
      const response: CheckoutResponse = await invoke("get_checkout_url");

      if (response.success && response.checkout_url) {
        // Open checkout URL in default browser
        await openUrl(response.checkout_url);
        setState?.(false);
      }
    } catch (err) {
      console.error("Failed to get checkout URL:", err);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGetLicenseKey}
      disabled={isCheckoutLoading}
      size="sm"
    >
      {isCheckoutLoading ? "Loading..." : "Get License"}
    </Button>
  );
};
