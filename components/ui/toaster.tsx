"use client";

import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
} from "./toast";
import { useToast } from "./use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(function ({ id, title, description, action, ...props }: {
        id: string;
        title?: React.ReactNode;
        description?: React.ReactNode;
        action?: React.ReactElement;
        [key: string]: any;
      }) {
        return (
          <Toast key={id} open={true} onOpenChange={(open) => {
            if (!open) dismiss(id);
          }} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose onToastClose={() => dismiss(id)} />
          </Toast>
        );
      })}
    </div>
  );
}
