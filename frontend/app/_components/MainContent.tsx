"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
};

export default function MainContent({ children }: Props) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return <main className={isAdminRoute ? "" : "flex-1"}>{children}</main>;
}
