import Link from "next/link";
import type { ReactNode } from "react";

function renderInline(text: string): ReactNode {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <Link
        key={`${match.index}-${match[2]}`}
        href={match[2]}
        target="_blank"
        rel="noreferrer"
        className="text-accent underline-offset-2 hover:underline"
      >
        {match[1]}
      </Link>
    );
    lastIndex = linkPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length === 0) return text;
  if (parts.length === 1) return parts[0];
  return <>{parts}</>;
}

function parseMarkdown(markdown: string) {
  const blocks = markdown.trim().split(/\n{2,}/);

  return blocks.map((block, index) => {
    const lines = block.split("\n").map((line) => line.trimEnd());
    const firstLine = lines[0]?.trim() ?? "";

    if (firstLine.startsWith("## ")) {
      return (
        <h3
          key={`heading-${index}`}
          className="text-sm font-medium text-foreground sm:text-base"
        >
          {renderInline(firstLine.slice(3))}
        </h3>
      );
    }

    const listLines = lines.filter((line) => line.trim().length > 0);
    const isList = listLines.every((line) => /^[*-]\s+/.test(line.trim()));

    if (isList) {
      return (
        <ul
          key={`list-${index}`}
          className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground-secondary"
        >
          {listLines.map((line) => {
            const item = line.trim().replace(/^[*-]\s+/, "");
            return <li key={item}>{renderInline(item)}</li>;
          })}
        </ul>
      );
    }

    return (
      <p
        key={`paragraph-${index}`}
        className="text-sm leading-relaxed text-foreground-secondary sm:text-base"
      >
        {renderInline(lines.join(" "))}
      </p>
    );
  });
}

export default function InfoUpdatesLog({ markdown }: { markdown: string }) {
  return (
    <div className="max-h-56 overflow-y-auto rounded-lg bg-subtle p-4">
      <div className="space-y-5">{parseMarkdown(markdown)}</div>
    </div>
  );
}
