import { createContext, useContext, useState, type ReactNode } from "react";

const QuickAddCtx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <QuickAddCtx.Provider value={{ open, setOpen }}>{children}</QuickAddCtx.Provider>;
}

export const useQuickAdd = () => useContext(QuickAddCtx);