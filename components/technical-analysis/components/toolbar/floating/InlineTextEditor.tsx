import React, { useEffect, useRef } from "react";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";

interface InlineTextEditorProps {
  position: { x: number; y: number };
  drawing: Drawing;
  initialValue?: string;
  /** Optional placeholder shown when the field is empty (e.g. "Add text" for signpost). Never persisted. */
  placeholder?: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  position,
  drawing,
  initialValue,
  placeholder,
  onSave,
  onCancel,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSave(input.value);
      } else if (e.key === "Escape") {
        onCancel();
      }
    };

    const handleBlur = () => {
      onSave(input.value);
    };

    input.addEventListener("keydown", handleKeyDown);
    input.addEventListener("blur", handleBlur);
    return () => {
      input.removeEventListener("keydown", handleKeyDown);
      input.removeEventListener("blur", handleBlur);
    };
  }, [onSave, onCancel]);

  return (
    <textarea
      ref={inputRef}
      placeholder={placeholder}
      defaultValue={initialValue !== undefined ? initialValue : drawing.text || ""}
      style={{
        position: "absolute",
        left: position.x - 80,
        top: position.y - 16,
        width: 160,
        minHeight: 32,
        zIndex: 2000,
        pointerEvents: "auto",
        background: "rgba(30, 34, 45, 0.95)",
        border: "2px solid #2962FF",
        borderRadius: 4,
        color: drawing.textColor || "#FFFFFF",
        fontSize: (drawing.fontSize || 14) + 2,
        fontFamily: "Inter, sans-serif",
        fontWeight: drawing.textBold ? "bold" : "normal",
        fontStyle: drawing.textItalic ? "italic" : "normal",
        textAlign: "center",
        padding: "4px 8px",
        resize: "none",
        outline: "none",
        overflow: "hidden",
        lineHeight: 1.4,
      }}
    />
  );
};
