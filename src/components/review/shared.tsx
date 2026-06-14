import type { ReviewStatus } from "@/lib/validation/review";

export function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#d9ded7] bg-white px-3 py-2 text-center shadow-sm">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-[#657064]">{label}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const classes = {
    pending: "bg-[#fff5d9] text-[#765a12]",
    approved: "bg-[#e4f2e7] text-[#285837]",
    rejected: "bg-[#f9e3e0] text-[#7a322c]",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}>
      {status}
    </span>
  );
}

export function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-[#eef1ec] px-2.5 py-1 text-xs font-medium text-[#4e594f]">
      {children}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#cfd7cf] bg-white p-8 text-center shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[#657064]">{body}</p>
    </div>
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
