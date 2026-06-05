import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type PrettySelectOption = {
  value: string;
  label: string;
  detail?: string;
  group?: string;
  disabled?: boolean;
};

type PrettySelectProps = {
  value?: string | number | null;
  options: PrettySelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  compact?: boolean;
  ariaLabel?: string;
};

export default function PrettySelect({
  value,
  options,
  onChange,
  placeholder = "Choisir",
  className,
  buttonClassName,
  menuClassName,
  compact = false,
  ariaLabel,
}: PrettySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const stringValue = value == null ? "" : String(value);
  const selected = options.find((option) => option.value === stringValue);
  const groups = options.reduce<Record<string, PrettySelectOption[]>>((acc, option) => {
    const group = option.group || "";
    acc[group] = acc[group] || [];
    acc[group].push(option);
    return acc;
  }, {});

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      onBlur={(event) => {
        if (!ref.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label={ariaLabel || placeholder}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-3 border border-primary/15 bg-white/90 text-left text-foreground shadow-sm transition-colors hover:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/15",
          compact ? "h-9 px-3 text-[10px] uppercase tracking-[0.2em]" : "h-12 px-3 text-sm",
          buttonClassName,
        )}
      >
        <span className={cn("min-w-0 truncate", selected ? "text-foreground" : "text-foreground/45")}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-foreground/45 transition-transform", open && "rotate-180")}
          strokeWidth={1.6}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-[calc(100%+6px)] z-40 max-h-72 w-full min-w-[220px] overflow-y-auto border border-primary/15 bg-white p-1 shadow-2xl",
            menuClassName,
          )}
        >
          {Object.entries(groups).map(([group, groupOptions]) => (
            <div key={group || "default"}>
              {group && (
                <p className="px-3 pb-1 pt-3 text-[9px] uppercase tracking-[0.32em] text-foreground/35">
                  {group}
                </p>
              )}
              {groupOptions.map((option) => {
                const isSelected = option.value === stringValue;
                return (
                  <button
                    key={`${group}-${option.value}`}
                    type="button"
                    disabled={option.disabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                      isSelected ? "bg-[#111111] text-white" : "text-foreground hover:bg-primary/5",
                      option.disabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{option.label}</span>
                      {option.detail && (
                        <span className={cn("mt-0.5 block text-[10px]", isSelected ? "text-white/65" : "text-foreground/45")}>
                          {option.detail}
                        </span>
                      )}
                    </span>
                    {isSelected && <Check className="h-4 w-4 shrink-0" strokeWidth={1.8} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
