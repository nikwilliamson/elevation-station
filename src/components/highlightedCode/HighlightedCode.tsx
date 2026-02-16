import { useDeferredValue, useEffect, useMemo, useState } from "react"

import { highlight, ready, waitForReady } from "../../hooks/useShikiHighlighter"

interface HighlightedCodeProps {
  code: string
  lang: "css" | "json"
}

export function HighlightedCode({ code, lang }: HighlightedCodeProps) {
  const [loaded, setLoaded] = useState(ready)

  useEffect(() => {
    if (!loaded) {
      void waitForReady().then(() => setLoaded(true))
    }
  }, [loaded])

  const deferredCode = useDeferredValue(code)

  const html = useMemo(() => {
    if (!loaded) return null
    return highlight(deferredCode, lang)
  }, [deferredCode, lang, loaded])

  if (html) {
    return <div className="es-output__highlighted" dangerouslySetInnerHTML={{ __html: html }} />
  }

  return <pre>{code}</pre>
}
