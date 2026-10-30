import { cn } from "@/lib/utils";

interface Props {
  text: string;
  /** ms before the first word starts appearing */
  delay?: number;
  /** ms between consecutive words */
  step?: number;
  className?: string;
  wordClassName?: string;
}

/** Text that softly fades, lifts and un-blurs in word by word. Re-mount (change `key`) to replay. */
export default function SplitWords({ text, delay = 0, step = 100, className, wordClassName }: Props) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i}>
          <span
            className={cn("inline-block animate-soft-reveal motion-reduce:animate-none", wordClassName)}
            style={{ animationDelay: `${delay + i * step}ms` }}
          >
            {word}
          </span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}
