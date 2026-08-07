import React, { useCallback } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Code,
  SquareCode,
  Link as LinkIcon,
  ListCheck,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Start typing Markdown here...",
  minHeight = "100%",
  className = "",
}: MarkdownEditorProps) {
  const editorRef = React.useRef<ReactCodeMirrorRef>(null);

  // Helper to insert formatting at cursor or selection
  const insertFormatting = useCallback(
    (prefix: string, suffix = "", defaultText = "text") => {
      const view = editorRef.current?.view;
      if (!view) {
        onChange(value + `${prefix}${defaultText}${suffix}`);
        return;
      }

      const selection = view.state.selection.main;
      const selectedText = view.state.sliceDoc(selection.from, selection.to) || defaultText;
      const replacement = `${prefix}${selectedText}${suffix}`;

      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: replacement },
        selection: { anchor: selection.from + prefix.length, head: selection.from + prefix.length + selectedText.length },
      });
      view.focus();
    },
    [onChange, value]
  );

  return (
    <div className={`flex flex-col border border-border/80 rounded-xl overflow-hidden bg-card shadow-sm ${className}`}>
      {/* ── Markdown Toolbar ── */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/60 bg-muted/40 overflow-x-auto text-xs shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("**", "**", "bold text")}
          className="h-7 w-7 p-0"
          title="Bold (**text**)"
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("*", "*", "italic text")}
          className="h-7 w-7 p-0"
          title="Italic (*text*)"
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <div className="h-4 w-px bg-border/60 mx-0.5" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("# ", "", "Heading 1")}
          className="h-7 w-7 p-0"
          title="Heading 1 (# Heading)"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("## ", "", "Heading 2")}
          className="h-7 w-7 p-0"
          title="Heading 2 (## Heading)"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("### ", "", "Heading 3")}
          className="h-7 w-7 p-0"
          title="Heading 3 (### Heading)"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </Button>
        <div className="h-4 w-px bg-border/60 mx-0.5" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("`", "`", "code")}
          className="h-7 w-7 p-0"
          title="Inline Code (`code`)"
        >
          <Code className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("```javascript\n", "\n```", "console.log('hello');")}
          className="h-7 w-7 p-0"
          title="Code Block (```)"
        >
          <SquareCode className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("[", "](https://example.com)", "link title")}
          className="h-7 w-7 p-0"
          title="Link ([title](url))"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </Button>
        <div className="h-4 w-px bg-border/60 mx-0.5" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting("- [ ] ", "", "New task")}
          className="h-7 w-7 p-0"
          title="Task List Item (- [ ])"
        >
          <ListCheck className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            insertFormatting(
              "\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n",
              "",
              ""
            )
          }
          className="h-7 w-7 p-0"
          title="Markdown Table"
        >
          <TableIcon className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* ── CodeMirror Editor Container ── */}
      <div className="flex-1 min-h-0 overflow-auto">
        <CodeMirror
          ref={editorRef}
          value={value}
          height="100%"
          minHeight={minHeight}
          extensions={[
            markdown({
              base: markdownLanguage,
              codeLanguages: languages,
            }),
          ]}
          onChange={onChange}
          placeholder={placeholder}
          theme="dark"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          className="h-full text-sm font-mono text-foreground [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
        />
      </div>
    </div>
  );
}
