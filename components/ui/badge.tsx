type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "success" | "info" | "warning";
};

export default function Badge({
  children,
  variant = "default",
}: BadgeProps) {
  const styles = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-100 text-green-700",
    info: "bg-blue-100 text-blue-700",
    warning: "bg-amber-100 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}