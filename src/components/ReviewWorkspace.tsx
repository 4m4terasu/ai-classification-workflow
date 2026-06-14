"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReviewItem, ReviewStatus } from "@/lib/validation/review";
import { ReviewDetailsPanel } from "@/components/review/ReviewDetailsPanel";
import { ReviewQueueList } from "@/components/review/ReviewQueueList";
import { ReviewSidebar } from "@/components/review/ReviewSidebar";
import type { ClassifyResponse, Draft, Filters, ListResponse } from "@/components/review/types";

const PAGE_SIZE = 6;

export function ReviewWorkspace() {
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [filters, setFilters] = useState<Filters>({ status: "", category: "", priority: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filteredSortedItems = useMemo(
    () =>
      items
        .filter((item) => !filters.status || item.status === filters.status)
        .filter((item) => !filters.category || item.category === filters.category)
        .filter((item) => !filters.priority || item.priority === filters.priority)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [filters, items],
  );
  const sortedAllItems = useMemo(
    () => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items],
  );
  const totalPages = Math.max(1, Math.ceil(filteredSortedItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filteredSortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredSortedItems],
  );
  const activeSelectedId = pageItems.some((item) => item.id === selectedId)
    ? selectedId
    : pageItems[0]?.id ?? null;
  const selectedItem = filteredSortedItems.find((item) => item.id === activeSelectedId) ?? null;
  const selectedDraft = selectedItem ? drafts[selectedItem.id] ?? draftFromItem(selectedItem) : null;

  useEffect(() => {
    async function loadItems() {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/review-items");
      const payload = (await response.json()) as ListResponse;

      if (!response.ok) {
        setError(payload.error ?? "Could not load review items.");
        setItems([]);
        setSelectedId(null);
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
  }, []);

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
    setPage(1);
    setSelectedId(payload.item.id);
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

    setItems((current) =>
      current.map((currentItem) => (currentItem.id === item.id ? payload.item! : currentItem)),
    );
    setDrafts((current) => ({ ...current, [payload.item!.id]: draftFromItem(payload.item!) }));
    setNotice(`Updated ${payload.item.status} item.`);
  }

  function updateDraft(id: string, update: Partial<Draft>) {
    const item = items.find((currentItem) => currentItem.id === id);

    if (!item) {
      return;
    }

    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? draftFromItem(item)),
        ...update,
      },
    }));
  }

  function updateFilters(nextFilters: Filters) {
    setFilters(nextFilters);
    setPage(1);
    setSelectedId(null);
  }

  function updatePage(nextPage: number) {
    setPage(nextPage);
    setSelectedId(null);
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#18201c]">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="border-b border-[#d9ded7] pb-5">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#667064]">
            Message triage
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-[#18201c]">
            AI classification review
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5c655b]">
            Submit inbound messages, scan the queue, and finalize the selected classification.
          </p>
        </header>

        <section className="grid gap-5 xl:grid-cols-[320px_minmax(430px,0.95fr)_minmax(460px,1.15fr)] 2xl:grid-cols-[340px_minmax(480px,0.95fr)_minmax(560px,1.15fr)]">
          <ReviewSidebar
            message={message}
            onMessageChange={setMessage}
            onSubmit={submitMessage}
            isSubmitting={isSubmitting}
            filters={filters}
            onFiltersChange={updateFilters}
            items={sortedAllItems}
            notice={notice}
            error={error}
          />
          <ReviewQueueList
            items={pageItems}
            selectedId={activeSelectedId}
            isLoading={isLoading}
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredSortedItems.length}
            totalPages={totalPages}
            onSelect={setSelectedId}
            onPageChange={updatePage}
          />
          <ReviewDetailsPanel
            item={selectedItem}
            draft={selectedDraft}
            onDraftChange={updateDraft}
            onUpdate={updateItem}
          />
        </section>
      </div>
    </main>
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
