import type { Category, Priority, ReviewItem, ReviewStatus } from "@/lib/validation/review";

export type Filters = {
  status: "" | ReviewStatus;
  category: "" | Category;
  priority: "" | Priority;
};

export type Draft = {
  category: Category;
  priority: Priority;
  suggestedReply: string;
  reviewerNote: string;
};

export type ClassifyResponse = {
  item: ReviewItem;
  provider: string;
  warnings: string[];
  error?: string;
};

export type ListResponse = {
  items: ReviewItem[];
  error?: string;
};
