type TextMessageProps = {
  children: React.ReactNode;
  variant?: "default" | "success" | "error";
};

export default function TextMessage({
  children,
  variant = "default",
}: TextMessageProps) {
  const styles = {
    default: "border-slate-200 bg-slate-50 text-slate-600",
    success: "border-green-200 bg-green-50 text-green-700",
    error: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${styles[variant]}`}>
      {children}
    </div>
  );
}
