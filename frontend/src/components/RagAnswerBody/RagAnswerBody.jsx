/**
 * Renders RAG "answer" text as Markdown (incl. fenced code) with readable styling.
 */
import { useCallback, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';
import styles from './RagAnswerBody.module.css';

// @param {{ children: string }} props
 
export default function RagAnswerBody({ children }) {
  const text = typeof children === 'string' ? children : '';
  if (!text.trim()) return null;

  return (
    <div className={styles.root}>
      <ReactMarkdown
        components={{
          p: ({ node: _n, ...props }) => <p className={styles.p} {...props} />,
          ul: ({ node: _n, ...props }) => (
            <ul className={styles.ul} {...props} />
          ),
          ol: ({ node: _n, ...props }) => (
            <ol className={styles.ol} {...props} />
          ),
          li: ({ node: _n, ...props }) => (
            <li className={styles.li} {...props} />
          ),
          h2: ({ node: _n, ...props }) => (
            <h2 className={styles.h2} {...props} />
          ),
          h3: ({ node: _n, ...props }) => (
            <h3 className={styles.h3} {...props} />
          ),
          blockquote: ({ node: _n, ...props }) => (
            <blockquote className={styles.blockquote} {...props} />
          ),
          a: ({ node: _n, ...props }) => (
            <a
              className={styles.a}
              target='_blank'
              rel='noreferrer noopener'
              {...props}
            />
          ),
          hr: ({ node: _n, ...props }) => (
            <hr className={styles.hr} {...props} />
          ),
          pre: ({ node: _n, children: preChildren }) => (
            <CodeBlock>{preChildren}</CodeBlock>
          ),
          code: ({ node: _n, className, children, ...props }) => {
            const isFence = Boolean(className?.trim());
            if (isFence) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={styles.inlineCode} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ children }) {
  const preRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const raw = preRef.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  const codeChild = Array.isArray(children) ? children[0] : children;
  const cls = codeChild?.props?.className;
  const langMatch =
    typeof cls === 'string' ? cls.match(/language-([\w+#.-]+)/) : null;
  const langLabel = langMatch ? langMatch[1] : 'code';

  return (
    <div className={styles.codeWrap}>
      <div className={styles.codeToolbar}>
        <span className={styles.codeLang}>{langLabel}</span>
        <button
          type='button'
          className={styles.copyBtn}
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
        >
          {copied ? (
            <>
              <Check size={14} aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} aria-hidden />
              Copy
            </>
          )}
        </button>
      </div>
      <pre ref={preRef} className={styles.pre}>
        {children}
      </pre>
    </div>
  );
}
