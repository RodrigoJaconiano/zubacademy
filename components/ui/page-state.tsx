import Link from "next/link";
import Card from "@/components/ui/card";

type PageStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
};

export default function PageState({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: PageStateProps) {
  return (
    <Card>
      {eyebrow ? (
        <p className="text-sm font-medium text-blue-700">{eyebrow}</p>
      ) : null}

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>

      {children ? <div className="mt-4">{children}</div> : null}

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          {actionLabel}
        </Link>
      ) : null}
    </Card>
  );
}