import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";

export function ResizableWorkspace({
  width,
  onWidthChange,
  sidebar,
  children,
}: {
  width: number;
  onWidthChange: (width: number) => void;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null),
    drag = useRef<{ id: number; width: number } | null>(null);
  function clamp(value: number) {
    const available = root.current?.clientWidth || 1000;
    return Math.round(Math.max(150, Math.min(value, 750, available - 308)));
  }
  function paint(value: number) {
    const next = clamp(value);
    root.current?.style.setProperty("--sidebar-width", `${next}px`);
    return next;
  }
  useLayoutEffect(() => {
    paint(width);
    const observer = new ResizeObserver(() => {
      if (!drag.current) paint(width);
    });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, [width]);
  return (
    <motion.main
      ref={root}
      className="workspace"
      style={{ "--sidebar-width": `${width}px` } as CSSProperties}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {sidebar}
      <div
        className="workspace-divider"
        role="separator"
        aria-label="Ridimensiona lista font"
        aria-orientation="vertical"
        aria-valuemin={150}
        aria-valuemax={Math.max(
          150,
          Math.min(750, (root.current?.clientWidth || 1000) - 308),
        )}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { id: e.pointerId, width };
          root.current?.classList.add("resizing");
        }}
        onPointerMove={(e) => {
          if (drag.current?.id !== e.pointerId || !root.current) return;
          drag.current.width = paint(
            e.clientX - root.current.getBoundingClientRect().left,
          );
        }}
        onPointerUp={(e) => {
          if (drag.current?.id !== e.pointerId) return;
          const next = drag.current.width;
          drag.current = null;
          root.current?.classList.remove("resizing");
          e.currentTarget.releasePointerCapture(e.pointerId);
          onWidthChange(next);
        }}
        onPointerCancel={() => {
          drag.current = null;
          root.current?.classList.remove("resizing");
          paint(width);
        }}
        onKeyDown={(e) => {
          let next = width;
          if (e.key === "ArrowLeft") next -= e.shiftKey ? 40 : 12;
          else if (e.key === "ArrowRight") next += e.shiftKey ? 40 : 12;
          else if (e.key === "Home") next = 150;
          else if (e.key === "End") next = 750;
          else return;
          e.preventDefault();
          e.stopPropagation();
          onWidthChange(paint(next));
        }}
        onDoubleClick={() => onWidthChange(258)}
      >
        <span />
      </div>
      {children}
    </motion.main>
  );
}
