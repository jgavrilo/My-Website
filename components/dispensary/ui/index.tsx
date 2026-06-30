import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

// ─── Button ────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  children:  ReactNode;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:   "bg-brand-500 hover:bg-brand-400 text-white shadow-sm",
  secondary: "bg-surface-300 hover:bg-surface-400 text-white border border-border",
  ghost:     "hover:bg-surface-300 text-white/70 hover:text-white",
  danger:    "bg-red-600/90 hover:bg-red-500 text-white shadow-sm",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";

// ─── Input ─────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?:  string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-white/60 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded bg-surface-200 border border-border px-3 py-2 text-sm text-white",
            "placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ─── Textarea ──────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-white/60 uppercase tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded bg-surface-200 border border-border px-3 py-2 text-sm text-white",
            "placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-brand-500",
            "resize-y min-h-[100px] transition-colors",
            error && "border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ─── Card ──────────────────────────────────────────────────────────────────

interface CardProps {
  children:   ReactNode;
  className?: string;
  padding?:   "none" | "sm" | "md" | "lg";
  onClick?:   () => void;
}

const paddingMap = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export function Card({ children, className, padding = "md", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn("rounded-lg bg-surface-100 border border-border", paddingMap[padding], className)}
    >
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-surface-300 text-white/70",
  success: "bg-brand-900 text-brand-300 border border-brand-700/50",
  warning: "bg-amber-900/40 text-amber-300 border border-amber-700/50",
  danger:  "bg-red-900/40 text-red-300 border border-red-700/50",
  info:    "bg-blue-900/40 text-blue-300 border border-blue-700/50",
};

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", badgeVariants[variant])}>
      {children}
    </span>
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-border", className)} />;
}

// ─── StatCard ──────────────────────────────────────────────────────────────

interface StatCardProps {
  label:    string;
  value:    string | number;
  delta?:   string;
  positive?: boolean;
  icon?:    ReactNode;
}

export function StatCard({ label, value, delta, positive, icon }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-brand-400">{icon}</span>}
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-display font-semibold text-white">{value}</span>
        {delta && (
          <span className={cn("text-xs mb-0.5", positive ? "text-brand-400" : "text-red-400")}>
            {delta}
          </span>
        )}
      </div>
    </Card>
  );
}
