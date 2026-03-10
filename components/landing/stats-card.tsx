type StatsCardProps = {
  value: string;
  label: string;
};

export default function StatsCard({ value, label }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white/85 p-4 shadow-sm backdrop-blur transition duration-200 hover:shadow-md">
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}