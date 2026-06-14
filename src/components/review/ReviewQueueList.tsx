"use client";

import type { ReviewItem } from "@/lib/validation/review";
import { Badge, EmptyState, formatDate, StatusBadge } from "@/components/review/shared";

type ReviewQueueListProps = {
  items: ReviewItem[];
  selectedId: string | null;
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onSelect: (id: string) => void;
  onPageChange: (page: number) => void;
};

export function ReviewQueueList({
  items,
  selectedId,
  isLoading,
  page,
  pageSize,
  totalItems,
  totalPages,
  onSelect,
  onPageChange,
}: ReviewQueueListProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <section className="flex min-h-[640px] min-w-0 flex-col rounded-lg border border-[#d9ded7] bg-white shadow-sm">
      <div className="border-b border-[#e2e6e0] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Review queue</h2>
            <p className="mt-1 text-xs text-[#657064]">
              {totalItems ? `${start}-${end} of ${totalItems} items` : "No matching items"}
            </p>
          </div>
          <span className="rounded-full bg-[#eef1ec] px-3 py-1 text-xs font-medium text-[#4e594f]">
            Newest first
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <EmptyState title="Loading queue" body="Fetching the current review items." />
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No review items"
              body="Submit a message or adjust the filters to see more items."
            />
          </div>
        ) : (
          <div className="divide-y divide-[#eef1ec]">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`block w-full px-4 py-3 text-left transition ${
                  selectedId === item.id
                    ? "bg-[#edf5ed] ring-1 ring-inset ring-[#8eb39a]"
                    : "bg-white hover:bg-[#f7f8f5]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={item.status} />
                      <Badge>{item.category.replace("_", " ")}</Badge>
                      <Badge>{item.priority}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-[#26302a]">
                      {item.summary}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#657064]">
                      {item.originalMessage}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-[#657064]">
                    <div>{Math.round(item.confidence * 100)}%</div>
                    <div className="mt-2">{formatDate(item.createdAt)}</div>
                    <div className="mt-1">Upd {formatDate(item.updatedAt)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#e2e6e0] p-3">
        <button
          type="button"
          disabled={page <= 1 || totalItems === 0}
          onClick={() => onPageChange(page - 1)}
          className="h-9 rounded-md border border-[#cfd7cf] px-3 text-sm font-medium transition hover:bg-[#f4f6f2] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Previous
        </button>
        <span className="text-xs font-medium text-[#657064]">
          Page {totalItems ? page : 0} of {totalItems ? totalPages : 0}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || totalItems === 0}
          onClick={() => onPageChange(page + 1)}
          className="h-9 rounded-md border border-[#cfd7cf] px-3 text-sm font-medium transition hover:bg-[#f4f6f2] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
        </button>
      </div>
    </section>
  );
}
