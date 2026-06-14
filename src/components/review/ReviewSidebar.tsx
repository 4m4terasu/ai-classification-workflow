"use client";

import { FormEvent } from "react";
import { categories, priorities, statuses, type ReviewItem } from "@/lib/validation/review";
import type { Filters } from "@/components/review/types";
import { Metric } from "@/components/review/shared";

type ReviewSidebarProps = {
  message: string;
  onMessageChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  items: ReviewItem[];
  notice: string;
  error: string;
};

export function ReviewSidebar({
  message,
  onMessageChange,
  onSubmit,
  isSubmitting,
  filters,
  onFiltersChange,
  items,
  notice,
  error,
}: ReviewSidebarProps) {
  return (
    <aside className="flex min-w-0 flex-col gap-4">
      <form onSubmit={onSubmit} className="rounded-lg border border-[#d9ded7] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">New message</h2>
          <span className="rounded-full bg-[#e8efe8] px-3 py-1 text-xs font-medium text-[#34513c]">
            Local-safe fallback
          </span>
        </div>
        <textarea
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          minLength={10}
          maxLength={8000}
          required
          className="mt-4 min-h-44 w-full resize-y rounded-md border border-[#cfd7cf] bg-[#fbfcfa] p-3 text-sm leading-6 outline-none transition focus:border-[#476f56] focus:ring-2 focus:ring-[#476f56]/20"
          placeholder="Paste a customer message here..."
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 h-11 w-full rounded-md bg-[#264f3a] px-4 text-sm font-semibold text-white transition hover:bg-[#1f3f30] disabled:cursor-not-allowed disabled:bg-[#8da093]"
        >
          {isSubmitting ? "Classifying..." : "Classify and queue"}
        </button>

        {(notice || error) && (
          <div
            className={`mt-4 rounded-md border px-3 py-2 text-sm ${
              error
                ? "border-[#efb8b8] bg-[#fff6f6] text-[#8a3030]"
                : "border-[#c9dbc9] bg-[#f3faf3] text-[#31563b]"
            }`}
          >
            {error || notice}
          </div>
        )}
      </form>

      <section className="rounded-lg border border-[#d9ded7] bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Filters</h2>
        <div className="mt-4 grid gap-3">
          <SelectFilter
            label="Status"
            value={filters.status}
            options={statuses}
            onChange={(value) => onFiltersChange({ ...filters, status: value as Filters["status"] })}
          />
          <SelectFilter
            label="Category"
            value={filters.category}
            options={categories}
            onChange={(value) =>
              onFiltersChange({ ...filters, category: value as Filters["category"] })
            }
          />
          <SelectFilter
            label="Priority"
            value={filters.priority}
            options={priorities}
            onChange={(value) =>
              onFiltersChange({ ...filters, priority: value as Filters["priority"] })
            }
          />
          <button
            type="button"
            onClick={() => onFiltersChange({ status: "", category: "", priority: "" })}
            className="h-10 rounded-md border border-[#cfd7cf] px-3 text-sm font-medium transition hover:bg-[#f4f6f2]"
          >
            Clear filters
          </button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Metric label="Pending" value={items.filter((item) => item.status === "pending").length} />
        <Metric label="Approved" value={items.filter((item) => item.status === "approved").length} />
        <Metric label="Rejected" value={items.filter((item) => item.status === "rejected").length} />
      </section>
    </aside>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-[#cfd7cf] bg-white px-3 text-sm outline-none focus:border-[#476f56] focus:ring-2 focus:ring-[#476f56]/20"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
