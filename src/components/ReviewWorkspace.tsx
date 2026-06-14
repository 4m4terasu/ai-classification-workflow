"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  categories,
  priorities,
  statuses,
  type Category,
  type Priority,
  type ReviewItem,
  type ReviewStatus,
} from "@/lib/validation/review";

type Filters = {
  status: "" | ReviewStatus;
  category: "" | Category;
  priority: "" | Priority;
};

type Draft = {
  category: Category;
  priority: Priority;
  suggestedReply: string;
  reviewerNote: string;
};

type ClassifyResponse = {
  item: ReviewItem;
  provider: string;
  warnings: string[];
  error?: string;
};

type ListResponse = {
  items: ReviewItem[];
  error?: string;
};

export function ReviewWorkspace() {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [filters, setFilters] = useState<Filters>({ status: "", category: "", priority: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.status) params.set("status", filters.status);
    if (filters.category) params.set("category", filters.category);
    if (filters.priority) params.set("priority", filters.priority);

    return params.toString();
  }, [filters]);

  useEffect(() => {
    async function loadItems() {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/review-items${queryString ? `?${queryString}` : ""}`);
      const payload = (await response.json()) as ListResponse;

      if (!response.ok) {
        setError(payload.error ?? "Could not load review items.");
        setIsLoading(false);
        return;
      }

      setItems(payload.items);
      setDrafts((current) => {
        const next = { ...current };

        for (const item of payload.items) {
          next[item.id] = next[item.id] ?? draftFromItem(item);
        }

        return next;
      });
      setIsLoading(false);
    }

    void loadItems();
  }, [queryString]);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setNotice("");

    const response = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const payload = (await response.json()) as ClassifyResponse;

    if (!response.ok) {
      setError(payload.error ?? "Classification failed.");
      setIsSubmitting(false);
      return;
    }

    setMessage("");
    setNotice(
      `Classified with ${payload.provider}${
        payload.warnings.length ? ` after ${payload.warnings.length} fallback note(s)` : ""
      }.`,
    );
    setItems((current) => [payload.item, ...current]);
    setDrafts((current) => ({ ...current, [payload.item.id]: draftFromItem(payload.item) }));
    setIsSubmitting(false);
  }

  async function updateItem(item: ReviewItem, update: Partial<Draft> & { status?: ReviewStatus }) {
    const draft = drafts[item.id] ?? draftFromItem(item);
    const response = await fetch(`/api/review-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: update.category ?? draft.category,
        priority: update.priority ?? draft.priority,
        suggestedReply: update.suggestedReply ?? draft.suggestedReply,
        reviewerNote: update.reviewerNote ?? draft.reviewerNote,
        status: update.status,
      }),
    });
    const payload = (await response.json()) as { item?: ReviewItem; error?: string };

    if (!response.ok || !payload.item) {
      setError(payload.error ?? "Could not update review item.");
      return;
    }

    setItems((current) => current.map((currentItem) => (currentItem.id === item.id ? payload.item! : currentItem)));
    setDrafts((current) => ({ ...current, [payload.item!.id]: draftFromItem(payload.item!) }));
    setNotice(`Updated ${payload.item.status} item.`);
  }

  function updateDraft(id: string, update: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...update,
      },
    }));
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#18201c]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-[#d9ded7] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#667064]">
              Message triage
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#18201c]">
              AI classification review
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5c655b]">
              Submit inbound messages, review the model output, and approve or reject the final routing decision.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric label="Pending" value={items.filter((item) => item.status === "pending").length} />
            <Metric label="Approved" value={items.filter((item) => item.status === "approved").length} />
            <Metric label="Rejected" value={items.filter((item) => item.status === "rejected").length} />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <form
            onSubmit={submitMessage}
            className="self-start rounded-lg border border-[#d9ded7] bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">New message</h2>
              <span className="rounded-full bg-[#e8efe8] px-3 py-1 text-xs font-medium text-[#34513c]">
                Local-safe fallback
              </span>
            </div>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              minLength={10}
              maxLength={8000}
              required
              className="mt-4 min-h-64 w-full resize-y rounded-md border border-[#cfd7cf] bg-[#fbfcfa] p-3 text-sm leading-6 outline-none transition focus:border-[#476f56] focus:ring-2 focus:ring-[#476f56]/20"
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

          <section className="flex min-w-0 flex-col gap-4">
            <div className="rounded-lg border border-[#d9ded7] bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-4">
                <SelectFilter
                  label="Status"
                  value={filters.status}
                  options={statuses}
                  onChange={(value) => setFilters((current) => ({ ...current, status: value as Filters["status"] }))}
                />
                <SelectFilter
                  label="Category"
                  value={filters.category}
                  options={categories}
                  onChange={(value) =>
                    setFilters((current) => ({ ...current, category: value as Filters["category"] }))
                  }
                />
                <SelectFilter
                  label="Priority"
                  value={filters.priority}
                  options={priorities}
                  onChange={(value) =>
                    setFilters((current) => ({ ...current, priority: value as Filters["priority"] }))
                  }
                />
                <button
                  type="button"
                  onClick={() => setFilters({ status: "", category: "", priority: "" })}
                  className="h-10 self-end rounded-md border border-[#cfd7cf] px-3 text-sm font-medium transition hover:bg-[#f4f6f2]"
                >
                  Clear filters
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isLoading ? (
                <EmptyState title="Loading queue" body="Fetching the current review items." />
              ) : items.length === 0 ? (
                <EmptyState title="No review items" body="Submit a message or adjust the filters to see more items." />
              ) : (
                items.map((item) => {
                  const draft = drafts[item.id] ?? draftFromItem(item);

                  return (
                    <article
                      key={item.id}
                      className="rounded-lg border border-[#d9ded7] bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={item.status} />
                            <Badge>{item.category.replace("_", " ")}</Badge>
                            <Badge>{item.priority}</Badge>
                            <span className="text-xs text-[#657064]">
                              {Math.round(item.confidence * 100)}% confidence
                            </span>
                          </div>
                          <h3 className="mt-3 text-base font-semibold">{item.summary}</h3>
                          <p className="mt-2 whitespace-pre-wrap rounded-md bg-[#f6f7f4] p-3 text-sm leading-6 text-[#404a42]">
                            {item.originalMessage}
                          </p>
                        </div>
                        <div className="text-xs text-[#657064] xl:text-right">
                          <div>Created {formatDate(item.createdAt)}</div>
                          <div>Updated {formatDate(item.updatedAt)}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="text-sm font-medium">
                          Category
                          <select
                            value={draft.category}
                            onChange={(event) =>
                              updateDraft(item.id, { category: event.target.value as Category })
                            }
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
                            onChange={(event) =>
                              updateDraft(item.id, { priority: event.target.value as Priority })
                            }
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

                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        <label className="text-sm font-medium">
                          Suggested reply
                          <textarea
                            value={draft.suggestedReply}
                            onChange={(event) => updateDraft(item.id, { suggestedReply: event.target.value })}
                            className="mt-1 min-h-32 w-full resize-y rounded-md border border-[#cfd7cf] bg-white p-3 text-sm leading-6 outline-none focus:border-[#476f56] focus:ring-2 focus:ring-[#476f56]/20"
                          />
                        </label>
                        <label className="text-sm font-medium">
                          Reviewer note
                          <textarea
                            value={draft.reviewerNote}
                            onChange={(event) => updateDraft(item.id, { reviewerNote: event.target.value })}
                            className="mt-1 min-h-32 w-full resize-y rounded-md border border-[#cfd7cf] bg-white p-3 text-sm leading-6 outline-none focus:border-[#476f56] focus:ring-2 focus:ring-[#476f56]/20"
                            placeholder="Optional internal note"
                          />
                        </label>
                      </div>

                      <p className="mt-3 text-xs leading-5 text-[#657064]">
                        Internal reasoning: {item.reasoning}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateItem(item, {})}
                          className="h-10 rounded-md border border-[#cfd7cf] px-3 text-sm font-medium transition hover:bg-[#f4f6f2]"
                        >
                          Save edits
                        </button>
                        <button
                          type="button"
                          disabled={item.status !== "pending"}
                          onClick={() => updateItem(item, { status: "approved" })}
                          className="h-10 rounded-md bg-[#264f3a] px-3 text-sm font-semibold text-white transition hover:bg-[#1f3f30] disabled:cursor-not-allowed disabled:bg-[#8da093]"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={item.status !== "pending"}
                          onClick={() => updateItem(item, { status: "rejected" })}
                          className="h-10 rounded-md bg-[#823d35] px-3 text-sm font-semibold text-white transition hover:bg-[#6d3029] disabled:cursor-not-allowed disabled:bg-[#b59691]"
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 rounded-lg border border-[#d9ded7] bg-white px-3 py-2 shadow-sm">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-[#657064]">{label}</div>
    </div>
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

function StatusBadge({ status }: { status: ReviewStatus }) {
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

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-[#eef1ec] px-2.5 py-1 text-xs font-medium text-[#4e594f]">
      {children}
    </span>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#cfd7cf] bg-white p-8 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[#657064]">{body}</p>
    </div>
  );
}

function draftFromItem(item: ReviewItem): Draft {
  return {
    category: item.category,
    priority: item.priority,
    suggestedReply: item.suggestedReply,
    reviewerNote: item.reviewerNote ?? "",
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
