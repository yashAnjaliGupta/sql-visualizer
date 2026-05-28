import React, { useEffect, useMemo, useRef, useState } from "react";

import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";

import { Decoration, EditorView } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import type { TextRange } from "../parser/locResolver";
import { format as formatSql } from "sql-formatter";

interface Theme {
  text: string;
  background: string;
  border: string;
  primary: string;
  secondary: string;
  isDark?: boolean;
}

interface CodeInputBoxProps {
  onSubmit: (input: string) => void;
  inputValue: string;
  theme?: Theme;
  onCollapse?: (collapsed: boolean) => void;
  highlights?: TextRange[];
}

const CollapseIcon = ({ color }: { color: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const CodeInputBox: React.FC<CodeInputBoxProps> = ({
  onSubmit,
  inputValue,
  theme,
  onCollapse,
  highlights,
}) => {
  // console.log("CodeInputBox render");

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [value, setValue] = useState(inputValue || "");

  const editorViewRef = useRef<EditorView | null>(null);

  // =========================
  // Sync external updates
  // =========================

  useEffect(() => {
    if (inputValue !== value) {
      console.log("External input update");

      setValue(inputValue);
    }
  }, [inputValue]);

  // =========================
  // Beautify SQL
  // =========================

  const handleBeautify = async () => {
    try {
      const formatted = formatSql(value, {
        language: "transactsql",

        keywordCase: "upper",

        linesBetweenQueries: 2,

        indentStyle: "standard",
      } as any);

      console.log("Beautified SQL");

      setValue(formatted);
      onSubmit(formatted);
    } catch (e) {
      console.log("Formatter failed:", e);
    }
  };

  // =========================
  // Submit
  // =========================

  const handleSubmit = () => {
    console.log("Submitting query:", value);

    onSubmit(value);
  };

  // =========================
  // Collapse
  // =========================

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);

    onCollapse?.(collapsed);
  };

  // =========================
  // Highlight decorations
  // =========================

  const highlightExtension = useMemo(() => {
    if (!highlights || highlights.length === 0) {
      return [];
    }

    return EditorView.decorations.compute([], () => {
      const builder = new RangeSetBuilder<Decoration>();

      [...highlights]

        .sort((a, b) => {
          if (a.startOffset !== b.startOffset) {
            if (a.startOffset === undefined || b.startOffset === undefined)
              return 0;
            return a.startOffset - b.startOffset;
          }
          if (a.endOffset === undefined || b.endOffset === undefined) return 0;
          return a.endOffset - b.endOffset;
        })

        .forEach((h) => {
          // invalid ranges
          if (
            h.startOffset === undefined ||
            h.endOffset === undefined ||
            h.startOffset >= h.endOffset
          ) {
            return;
          }

          builder.add(
            h.startOffset,
            h.endOffset,
            Decoration.mark({
              class: "cm-sql-highlight",
            })
          );
        });

      return builder.finish();
    });
  }, [highlights]);

  // =========================
  // Extensions
  // =========================

  const extensions = useMemo(() => {
    return [
      sql(),

      highlightExtension,

      EditorView.lineWrapping,

      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "13px",
          backgroundColor: theme?.background || "#1A202C",
        },

        ".cm-scroller": {
          overflow: "auto",
          fontFamily: "Consolas, monospace",
        },

        ".cm-content": {
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          caretColor: theme?.text || "#FFFFFF",
          padding: "12px 0",
        },

        ".cm-line": {
          padding: "0 12px",
        },

        ".cm-editor": {
          height: "100%",
        },

        ".cm-focused": {
          outline: "none",
        },

        ".cm-gutters": {
          backgroundColor: theme?.background || "#1A202C",
          color: theme?.text || "#FFFFFF",
          border: "none",
        },

        ".cm-activeLineGutter": {
          backgroundColor: "transparent",
        },

        ".cm-activeLine": {
          backgroundColor: "rgba(255,255,255,0.04)",
        },

        ".cm-selectionBackground": {
          backgroundColor: "rgba(59,130,246,0.3)",
        },

        ".cm-cursor": {
          borderLeftColor: theme?.text || "#FFFFFF",
        },
      }),
    ];
  }, [highlightExtension, theme]);

  return (
    <div
      className={`
                relative
                transition-all
                duration-300
                h-full
                ${isCollapsed ? "-translate-x-[380px]" : "translate-x-0"}
            `}
    >
      <div
        className={`
                    h-full
                    w-[420px]
                    flex
                    flex-col
                    rounded-xl
                    overflow-hidden
                    border
                    shadow-2xl
                `}
        style={{
          backgroundColor: theme?.background || "#1A202C",

          borderColor: theme?.border || "#4A5568",
        }}
      >
        {/* Header */}

        <div
          className="
                        flex
                        items-center
                        justify-between
                        px-4
                        py-3
                        border-b
                        shrink-0
                    "
          style={{
            borderColor: theme?.border || "#4A5568",
          }}
        >
          {/* Left */}

          <button
            onClick={() => handleCollapse(true)}
            title="Collapse SQL Editor"
            className="
                            flex
                            items-center
                            justify-center
                            p-1.5
                            rounded-md
                            border
                            transition-colors
                            hover:bg-white/10
                        "
            style={{
              borderColor: theme?.border || "#4A5568",

              color: theme?.text || "#FFFFFF",
            }}
          >
            <CollapseIcon color={theme?.text || "#FFFFFF"} />
          </button>

          {/* Title */}

          <span
            className="
                            text-base
                            font-bold
                            tracking-wide
                        "
            style={{
              color: theme?.text || "#FFFFFF",
            }}
          >
            SQL Query
          </span>

          {/* Buttons */}

          <div
            className="
                            flex
                            items-center
                            gap-2
                        "
          >
            <button
              onClick={handleBeautify}
              className="
                                px-3.5
                                py-2
                                text-sm
                                font-semibold
                                rounded-lg
                                border
                                transition-all
                                hover:shadow-md
                                hover:opacity-90
                            "
              style={{
                backgroundColor: theme?.secondary || "#2D3748",

                borderColor: theme?.border || "#4A5568",

                color: theme?.text || "#FFFFFF",
              }}
            >
              Format
            </button>

            <button
              onClick={handleSubmit}
              className="
                                px-3.5
                                py-2
                                text-sm
                                font-bold
                                rounded-lg
                                transition-all
                                hover:shadow-lg
                                hover:opacity-90
                            "
              style={{
                backgroundColor: theme?.primary || "#3B82F6",

                color: "#FFFFFF",
                boxShadow: `0 4px 12px ${theme?.primary || "#3B82F6"}40`,
              }}
            >
              Execute
            </button>
          </div>
        </div>

        {/* Editor */}

        <div
          className="
                        flex-1
                        overflow-hidden
                    "
        >
          <CodeMirror
            value={value}
            height="100%"
            theme={theme?.isDark ? oneDark : "light"}
            extensions={extensions}
            onCreateEditor={(view) => {
              console.log("CodeMirror mounted");

              editorViewRef.current = view;
            }}
            onChange={(val) => {
              console.log("Typing:", val);

              setValue(val);
            }}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              autocompletion: true,
              bracketMatching: true,
              closeBrackets: true,
            }}
          />
        </div>
      </div>

      {/* Highlight styles */}

      <style>
        {`
                .cm-sql-highlight {
                    background-color:
                        rgba(255, 0, 114, 0.25);
                    border-radius: 2px;
                }

                .cm-editor {
                    height: 100%;
                }

                .cm-scroller {
                    overflow-x: hidden !important;
                }

                .cm-content {
                    white-space: pre-wrap !important;
                    overflow-wrap: anywhere !important;
                    word-break: break-word !important;
                }
                `}
      </style>
    </div>
  );
};

export default CodeInputBox;
