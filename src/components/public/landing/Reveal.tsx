import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Fades and lifts its children into place the first time they scroll into view. */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        shown
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8 motion-reduce:opacity-100 motion-reduce:translate-y-0",
        className
      )}
      style={shown ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
