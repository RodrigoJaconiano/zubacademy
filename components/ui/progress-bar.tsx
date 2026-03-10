type ProgressBarProps = {
  value: number;
};

export default function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-blue-100">
      <div
        className="h-full rounded-full bg-blue-600 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}