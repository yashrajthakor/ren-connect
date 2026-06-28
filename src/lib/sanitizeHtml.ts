import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "span",
];

const ALLOWED_ATTR = ["href", "target", "rel", "style"];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

export function isHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content.trim());
}

export function htmlToPlainText(html: string): string {
  if (!html.trim()) return "";
  if (!isHtmlContent(html)) return html.trim();
  const div = document.createElement("div");
  div.innerHTML = sanitizeHtml(html);
  return div.textContent?.trim() || "";
}
