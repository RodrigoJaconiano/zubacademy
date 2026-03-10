type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <p className="text-sm font-medium text-blue-700">{eyebrow}</p>
      ) : null}

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>

      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
  );
}