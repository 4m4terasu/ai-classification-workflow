"use client";

import { categories, priorities, type Category, type Priority, type ReviewItem, type ReviewStatus } from "@/lib/validation/review";
import type { Draft } from "@/components/review/types";
import { Badge, EmptyState, formatDate, StatusBadge } from "@/components/review/shared";

type ReviewDetailsPanelProps = {
  item: ReviewItem | null;
  draft: Draft | null;
  onDraftChange: (id: string, update: Partial<Draft>) => void;
  onUpdate: (item: ReviewItem, update: Partial<Draft> & { status?: ReviewStatus }) => void;
};

export function ReviewDetailsPanel({
  item,
  draft,
  onDraftChange,
  onUpdate,
}: ReviewDetailsPanelProps) {
  if (!item || !draft) {
    return (
      <section className="min-h-[640px] rounded-lg border border-[#d9ded7] bg-white p-4 shadow-sm">
        <EmptyState
          title="Select an item"
          body="Choose a queue item to inspect the classification and make review edits."
        />
      </section>
    );
  }

  return (
    <section className="min-h-[640px] rounded-lg border border-[#d9ded7] bg-white shadow-sm">
      <div className="border-b border-[#e2e6e0] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              <Badge>{item.category.replace("_", " ")}</Badge>
              <Badge>{item.priority}</Badge>
              <span className="text-xs text-[#657064]">
                {Math.round(item.confidence * 100)}% confidence
              </span>
            </div>
            <h2 className="mt-3 text-lg font-semibold leading-7">{item.summary}</h2>
          </div>
          <div className="shrink-0 text-xs text-[#657064] sm:text-right">
            <div>Created {formatDate(item.createdAt)}</div>
            <div>Updated {formatDate(item.updatedAt)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <section>
          <h3 className="text-sm font-semibold">Original message</h3>
          <p className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap rounded-md bg-[#f6f7f4] p-3 text-sm leading-6 text-[#404a42]">
            {item.originalMessage}
          </p>
        </section>

        <section>
          <h3 className="text-sm font-semibold">Internal reasoning</h3>
          <p className="mt-2 rounded-md border border-[#e2e6e0] bg-white p-3 text-sm leading-6 text-[#657064]">
            {item.reasoning}
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Category
            <select
              value={draft.category}
              onChange={(event) => onDraftChange(item.id, { category: event.target.value as Category })}
              className="mt-1 h-10 w-full rounded-md border border-[#cfd7cf] bg-white px-3 text-sm outline-none focus:border-[#476f56] focus:ring-2 focus:ring-[#476f56]/20"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Priority
            <select
              value={draft.priority}
              onChange={(event) => onDraftChange(item.id, { priority: event.target.value as Priority })}
              className="mt-1 h-10 w-full rounded-md border border-[#cfd7cf] bg-white px-3 text-sm outline-none focus:border-[#476f56] focus:ring-2 focus:ring-[#476f56]/20"
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="text-sm font-medium">
          Suggested reply
          <textarea
            value={draft.suggestedReply}
            onChange={(event) => onDraftChange(item.id, { suggestedReply: event.target.value })}
            className="mt-1 min-h-36 w-full resize-y rounded-md border border-[#cfd7cf] bg-white p-3 text-sm leading-6 outline-none focus:border-[#476f56] focus:ring-2 focus:ring-[#476f56]/20"
          />
        </label>

        <label className="text-sm font-medium">
          Reviewer note
          <textarea
            value={draft.reviewerNote}
            onChange={(event) => onDraftChange(item.id, { reviewerNote: event.target.value })}
            className="mt-1 min-h-28 w-full resize-y rounded-md border border-[#cfd7cf] bg-white p-3 text-sm leading-6 outline-none focus:border-[#476f56] focus:ring-2 focus:ring-[#476f56]/20"
            placeholder="Optional internal note"
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => onUpdate(item, {})}
            className="h-10 rounded-md border border-[#cfd7cf] px-3 text-sm font-medium transition hover:bg-[#f4f6f2]"
          >
            Save edits
          </button>
          <button
            type="button"
            disabled={item.status !== "pending"}
            onClick={() => onUpdate(item, { status: "approved" })}
            className="h-10 rounded-md bg-[#264f3a] px-3 text-sm font-semibold text-white transition hover:bg-[#1f3f30] disabled:cursor-not-allowed disabled:bg-[#8da093]"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={item.status !== "pending"}
            onClick={() => onUpdate(item, { status: "rejected" })}
            className="h-10 rounded-md bg-[#823d35] px-3 text-sm font-semibold text-white transition hover:bg-[#6d3029] disabled:cursor-not-allowed disabled:bg-[#b59691]"
          >
            Reject
          </button>
        </div>
      </div>
    </section>
  );
}
