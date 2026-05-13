"use client";

import { Provider } from "react-redux";
import { ReactNode } from "react";
import { store } from "./index";

interface StoreProviderProps {
  children: ReactNode;
}

export default function StoreProvider({ children }: StoreProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
