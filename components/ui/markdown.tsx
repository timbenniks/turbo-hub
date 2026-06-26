import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

/**
 * react-markdown passes a `node` prop to each renderer; it isn't a valid DOM
 * attribute, so strip it before spreading onto a host element.
 */
function withoutNode<T extends { node?: unknown }>({ node, ...rest }: T) {
  void node
  return rest
}

/**
 * Render trusted-but-user-authored Markdown. react-markdown escapes raw HTML by
 * default (no rehype-raw), so pasted external content can't inject markup.
 * Elements are styled inline since the project has no typography plugin.
 */
const components: Components = {
  h1: (p) => (
    <h1
      className="mt-4 mb-2 text-base font-semibold first:mt-0"
      {...withoutNode(p)}
    />
  ),
  h2: (p) => (
    <h2
      className="mt-4 mb-2 text-sm font-semibold first:mt-0"
      {...withoutNode(p)}
    />
  ),
  h3: (p) => (
    <h3
      className="mt-3 mb-1.5 text-sm font-medium first:mt-0"
      {...withoutNode(p)}
    />
  ),
  p: (p) => <p className="my-2 first:mt-0 last:mb-0" {...withoutNode(p)} />,
  ul: (p) => (
    <ul className="my-2 list-disc space-y-1 pl-5" {...withoutNode(p)} />
  ),
  ol: (p) => (
    <ol className="my-2 list-decimal space-y-1 pl-5" {...withoutNode(p)} />
  ),
  li: (p) => <li className="pl-0.5" {...withoutNode(p)} />,
  a: (p) => (
    <a
      className="text-primary underline underline-offset-2"
      target="_blank"
      rel="noreferrer"
      {...withoutNode(p)}
    />
  ),
  strong: (p) => <strong className="font-semibold" {...withoutNode(p)} />,
  code: (p) => (
    <code
      className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
      {...withoutNode(p)}
    />
  ),
  pre: (p) => (
    <pre
      className="my-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs"
      {...withoutNode(p)}
    />
  ),
  blockquote: (p) => (
    <blockquote
      className="my-2 border-l-2 border-border pl-3 text-muted-foreground"
      {...withoutNode(p)}
    />
  ),
  hr: (p) => <hr className="my-3 border-border" {...withoutNode(p)} />,
  table: (p) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-left" {...withoutNode(p)} />
    </div>
  ),
  th: (p) => (
    <th
      className="border border-border px-2 py-1 font-medium"
      {...withoutNode(p)}
    />
  ),
  td: (p) => (
    <td
      className="border border-border px-2 py-1 align-top"
      {...withoutNode(p)}
    />
  ),
}

export function Markdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div className={cn("text-sm break-words", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
