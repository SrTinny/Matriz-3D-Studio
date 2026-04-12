"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  value: string | number;
  onSave: (newValue: string | number) => Promise<void>;
  inputType?: "text" | "number";
  displayFormatter?: (v: string | number) => string;
  className?: string;
};

export default function InlineEditCell({ value, onSave, inputType = "text", displayFormatter, className }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(() => String(value ?? ""));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setEditValue(String(value ?? ""));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  async function save() {
    if (saving) return;
    const newVal = inputType === "number" ? Number(editValue) : editValue;
    try {
      console.debug("InlineEditCell.save() start", { editValue, inputType, newVal });
      setSaving(true);
      await onSave(newVal);
      console.debug("InlineEditCell.save() onSave resolved", { newVal });
    } catch (err) {
      console.error("InlineEditCell.save() onSave error", err);
      throw err;
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      console.debug("InlineEditCell.onKeyDown Enter", { editValue });
      void save();
    } else if (e.key === "Escape") {
      console.debug("InlineEditCell.onKeyDown Escape");
      setIsEditing(false);
      setEditValue(String(value ?? ""));
    }
  }

  return (
    <div className={"inline-block" + (className ? ` ${className}` : "")}>
      {!isEditing ? (
        <div onClick={() => setIsEditing(true)} className="cursor-pointer select-none">
          {displayFormatter ? displayFormatter(value) : String(value)}
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            className="input-base w-28"
            value={editValue}
            type={inputType}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => { void save(); }}
            onKeyDown={onKeyDown}
          />
          {saving && <span className="ml-2 text-sm text-slate-500">Salvando…</span>}
        </div>
      )}
    </div>
  );
}
