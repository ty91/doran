import ReactMarkdown, { type Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h2 className="mt-6 mb-2 text-base font-semibold tracking-tight first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-2 text-base font-semibold tracking-tight first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 text-base font-semibold tracking-tight first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-6 mb-2 text-base font-semibold tracking-tight first:mt-0">{children}</h4>
  ),
  h5: ({ children }) => <h5 className="mt-4 mb-1 font-semibold first:mt-0">{children}</h5>,
  h6: ({ children }) => <h6 className="mt-4 mb-1 font-semibold first:mt-0">{children}</h6>,
  p: ({ children }) => <p className="my-2">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-1 list-disc space-y-1 pl-5 marker:text-zinc-400 dark:marker:text-zinc-500">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 list-decimal space-y-1 pl-5 marker:text-zinc-400 dark:marker:text-zinc-500">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-900 dark:text-zinc-50">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-900 dark:hover:decoration-zinc-50"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-zinc-300 pl-3 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-zinc-200 dark:border-zinc-800" />,
};

export function Markdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-7 text-zinc-800 dark:text-zinc-200">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
