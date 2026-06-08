import { useEffect, useState } from "react";
import mermaid from "mermaid";

// Initialise once. startOnLoad: false because we render explicitly via
// mermaid.render() so we can size the result after the async render completes
// (avoids the initial layout jump warned about in the brief).
mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

// mermaid.render needs a unique DOM id per diagram; a module counter keeps them
// stable and collision-free across cards.
let diagramCounter = 0;

export function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `deckgun-mermaid-${diagramCounter++}`;

    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err?.message ?? err));
          setSvg(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return <pre className="mermaid-error">{error}</pre>;
  }

  if (svg === null) {
    return <div className="mermaid-loading">Rendering diagram…</div>;
  }

  return (
    <div
      className="mermaid-diagram"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
