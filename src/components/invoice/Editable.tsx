import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface FieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  type?: "text" | "date" | "email" | "tel";
  invalid?: boolean;
}

const base =
  "w-full bg-transparent outline-none rounded-[4px] px-1 -mx-1 transition-colors placeholder:text-inksoft/45 focus:bg-accent/6 hover:bg-ink/4 print:hover:bg-transparent print:focus:bg-transparent";

export function Field({
  value,
  onChange,
  placeholder,
  className,
  align = "left",
  type = "text",
  invalid,
}: FieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (type === "text" && ref.current) {
      ref.current.style.height = "0px";
      const scrollHeight = ref.current.scrollHeight;
      ref.current.style.height = `${scrollHeight}px`;
    }
  }, [value, type]);

  if (type === "text") {
    return (
      <textarea
        ref={ref}
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          base,
          "resize-none overflow-hidden block",
          align === "right" && "text-right",
          invalid && "bg-destructive/8 ring-1 ring-destructive/40",
          className,
        )}
      />
    );
  }

  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        base,
        align === "right" && "text-right",
        invalid && "bg-destructive/8 ring-1 ring-destructive/40",
        className,
      )}
    />
  );
}

interface NumFieldProps {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  max?: number;
  step?: number;
}

export function NumField({ value, onChange, className, max, step = 1 }: NumFieldProps) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      className={cn(
        base,
        "text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
        className,
      )}
    />
  );
}

export function AreaField({
  value,
  onChange,
  placeholder,
  className,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "0px";
      const scrollHeight = ref.current.scrollHeight;
      ref.current.style.height = `${scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(base, "resize-none overflow-hidden leading-relaxed", className)}
    />
  );
}

export function ImageSlot({
  value,
  onChange,
  label,
  className,
  imgClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  className?: string;
  imgClassName?: string;
}) {
  const read = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <label
      className={cn(
        "group relative grid cursor-pointer place-items-center overflow-hidden rounded-[8px] bg-ink/5 outline-1 -outline-offset-1 outline-black/5 print:bg-transparent print:outline-none",
        className,
      )}
    >
      {value ? (
        <img
          src={value}
          alt={label}
          className={cn("h-full w-full object-contain mix-blend-multiply", imgClassName)}
        />
      ) : (
        <span className="px-1 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-inksoft/70">
          {label}
        </span>
      )}
      <input
        type="file"
        accept="image/*"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => read(e.target.files?.[0])}
      />
    </label>
  );
}
