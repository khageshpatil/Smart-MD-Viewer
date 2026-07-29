/**
 * Global hotkey handler hook
 * Listens for Ctrl+Space (Cmd+Space on Mac) to trigger voice commands
 */

import { useEffect, useCallback } from "react";

export interface UseGlobalHotkeyOptions {
  onTrigger: () => void;
  enabled?: boolean;
  key?: string;
  modifiers?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
}

export const useGlobalHotkey = ({
  onTrigger,
  enabled = true,
  key = " ",
  modifiers = { ctrl: true },
}: UseGlobalHotkeyOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if the pressed key matches
      if (event.key !== key) return;

      // Check modifiers
      const ctrlPressed = modifiers.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const metaPressed = modifiers.meta ? event.metaKey : !event.metaKey;
      const shiftPressed = modifiers.shift ? event.shiftKey : !event.shiftKey;
      const altPressed = modifiers.alt ? event.altKey : !event.altKey;

      // For Ctrl+Space, allow either Ctrl (Windows/Linux) or Cmd (Mac)
      const modifierMatch = modifiers.ctrl
        ? (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey
        : ctrlPressed && metaPressed && shiftPressed && altPressed;

      if (modifierMatch) {
        event.preventDefault();
        event.stopPropagation();
        onTrigger();
      }
    },
    [enabled, key, modifiers, onTrigger]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
};



