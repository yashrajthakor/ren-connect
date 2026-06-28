import { sanitizeHtml, isHtmlContent } from "@/lib/sanitizeHtml";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  className?: string;
};

export function NewsletterContent({ content, className }: Props) {
  if (!content.trim()) return null;

  if (isHtmlContent(content)) {
    return (
      <div
        className={cn(
          "prose prose-slate max-w-none prose-headings:font-display prose-headings:text-secondary prose-a:text-primary prose-p:leading-relaxed",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  return (
    <div
      className={cn(
        "prose prose-slate max-w-none prose-headings:font-display prose-headings:text-secondary prose-a:text-primary whitespace-pre-wrap leading-relaxed",
        className,
      )}
    >
      {content}
    </div>
  );
}
