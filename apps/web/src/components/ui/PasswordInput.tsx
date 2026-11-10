"use client";

import { useState, forwardRef, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
  wrapperClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = "", wrapperClassName = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className={`relative flex items-center w-full ${wrapperClassName}`}>
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={`pr-11 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#888888] hover:text-white transition-colors rounded-md focus:outline-none focus:ring-1 focus:ring-white/40"
          aria-label={showPassword ? "Hide password" : "Show password"}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Eye className="size-4 shrink-0" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
