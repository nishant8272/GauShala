import React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WhatsAppButtonProps extends ButtonProps {
  /**
   * The button label or initial message text
   */
  initialText?: string;
  /**
   * The pre-filled message text to populate in WhatsApp (defaults to "Hi")
   */
  message?: string;
  /**
   * Optional override for WhatsApp business phone number
   */
  phoneNumber?: string;
  /**
   * Whether to show the MessageCircle WhatsApp icon (defaults to true)
   */
  showIcon?: boolean;
}

// Immediate synchronous resolution from Vite env or default fallback - eliminates redundant network calls
const CONFIGURED_BUSINESS_NUMBER =
  (import.meta.env.VITE_BUSINESS_PHONE_NUMBER as string | undefined) ||
  "15551980995";

export const WhatsAppButton = React.forwardRef<
  HTMLButtonElement,
  WhatsAppButtonProps
>(
  (
    {
      initialText,
      message = "Hi",
      phoneNumber: explicitPhoneNumber,
      className,
      variant = "outline",
      size = "lg",
      showIcon = true,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e);
      }

      if (e.defaultPrevented) return;

      const targetNumber = (
        explicitPhoneNumber ||
        CONFIGURED_BUSINESS_NUMBER
      ).replace(/\D/g, "");

      const textToSend = message || "Hi";
      const waUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(
        textToSend
      )}`;

      window.open(waUrl, "_blank", "noopener,noreferrer");
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "cursor-pointer transition-all hover:scale-105 active:scale-95",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {showIcon && (
          <MessageCircle className="mr-2 h-4 w-4 text-green-400 shrink-0" />
        )}
        {children || initialText || "Chat on WhatsApp"}
      </Button>
    );
  }
);

WhatsAppButton.displayName = "WhatsAppButton";
export default WhatsAppButton;
