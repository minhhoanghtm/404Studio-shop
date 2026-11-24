import React from 'react';

const safeHref = (value: string) => (/^https?:\/\//i.test(value) ? value : undefined);

function inline(value: string): React.ReactNode[] {
  const parts = value.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]*\))/g);
  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-[var(--bg)] px-1 py-0.5 font-mono text-[11px]">{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]*)\)$/);
    if (link) {
      const href = safeHref(link[2]);
      return href ? <a key={index} href={href} target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">{link[1]}</a> : <span key={index}>{link[1]}</span>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/** Renders model Markdown as React nodes; it never accepts model-supplied HTML. */
export const SafeMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const nodes: React.ReactNode[] = [];
  let code: string[] = [];
  let inCode = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (inCode) nodes.push(<pre key={`code-${i}`} className="overflow-x-auto rounded-lg bg-[var(--bg)] p-2 font-mono text-[11px]"><code>{code.join('\n')}</code></pre>);
      code = [];
      inCode = !inCode;
      continue;
    }
    if (inCode) { code.push(line); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Tag = heading[1].length === 1 ? 'h3' : heading[1].length === 2 ? 'h4' : 'h5';
      nodes.push(<Tag key={`h-${i}`} className="font-display font-bold text-[var(--text)]">{inline(heading[2])}</Tag>);
      continue;
    }
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
    if (bullet) { nodes.push(<div key={`b-${i}`} className="flex gap-1.5"><span>•</span><span>{inline(bullet[1])}</span></div>); continue; }
    const numbered = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (numbered) { nodes.push(<div key={`n-${i}`} className="flex gap-1.5"><span>{numbered[1]}.</span><span>{inline(numbered[2])}</span></div>); continue; }
    if (line.startsWith('> ')) { nodes.push(<blockquote key={`q-${i}`} className="border-l-2 border-[var(--accent)] pl-2 text-[var(--text-muted)]">{inline(line.slice(2))}</blockquote>); continue; }
    if (/^\|.+\|$/.test(line) && !/^\|?\s*:?-{3,}/.test(line)) {
      const cells = line.split('|').slice(1, -1);
      nodes.push(<div key={`t-${i}`} className="grid grid-flow-col auto-cols-fr gap-px overflow-x-auto rounded border border-[var(--border)] bg-[var(--border)]">{cells.map((cell, cellIndex) => <span key={cellIndex} className="bg-[var(--surface)] px-2 py-1">{inline(cell.trim())}</span>)}</div>);
      continue;
    }
    if (/^\|?\s*:?-{3,}/.test(line) || !line.trim()) { if (!line.trim()) nodes.push(<div key={`space-${i}`} className="h-1" />); continue; }
    nodes.push(<p key={`p-${i}`} className="m-0">{inline(line)}</p>);
  }
  if (inCode) nodes.push(<pre key="code-eof" className="overflow-x-auto rounded-lg bg-[var(--bg)] p-2 font-mono text-[11px]"><code>{code.join('\n')}</code></pre>);
  return <div className="space-y-1.5">{nodes}</div>;
};

export default SafeMarkdown;
