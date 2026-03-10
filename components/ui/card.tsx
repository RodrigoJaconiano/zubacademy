type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-[var(--border)] bg-white/85 p-6 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}