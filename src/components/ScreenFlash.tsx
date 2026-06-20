"use client";

import { useEffect, useState } from "react";

export function ScreenFlash({
  active,
  variant = "ssr",
}: {
  active: boolean;
  variant?: "ssr" | "sr" | "near";
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 600);
    return () => clearTimeout(t);
  }, [active]);

  if (!show) return null;

  const colors = {
    ssr: "from-yellow-200/40 via-amber-300/30 to-orange-400/20",
    sr: "from-purple-300/35 via-violet-400/25 to-fuchsia-500/15",
    near: "from-amber-200/25 via-orange-300/15 to-yellow-400/10",
  };

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 animate-screen-flash bg-gradient-to-br ${colors[variant]}`}
      aria-hidden
    />
  );
}
