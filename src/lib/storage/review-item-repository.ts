import { promises as fs } from "fs";
import path from "path";
import {
  ReviewItemListSchema,
  type Classification,
  type ReviewItem,
  type ReviewItemUpdate,
} from "@/lib/validation/review";

const dataDirectory = path.join(process.cwd(), "data");
const queuePath = path.join(dataDirectory, "review-items.json");

let writeQueue = Promise.resolve();

export async function listReviewItems(filters?: {
  status?: string;
  category?: string;
  priority?: string;
}) {
  const items = await readItems();

  return items
    .filter((item) => !filters?.status || item.status === filters.status)
    .filter((item) => !filters?.category || item.category === filters.category)
    .filter((item) => !filters?.priority || item.priority === filters.priority)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReviewItem(
  originalMessage: string,
  classification: Classification,
): Promise<ReviewItem> {
  const now = new Date().toISOString();
  const item: ReviewItem = {
    id: crypto.randomUUID(),
    originalMessage,
    ...classification,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await updateItems((items) => [item, ...items]);

  return item;
}

export async function updateReviewItem(
  id: string,
  update: ReviewItemUpdate,
): Promise<ReviewItem | null> {
  let updatedItem: ReviewItem | null = null;

  await updateItems((items) =>
    items.map((item) => {
      if (item.id !== id) {
        return item;
      }

      updatedItem = {
        ...item,
        ...update,
        reviewerNote: update.reviewerNote ?? item.reviewerNote,
        updatedAt: new Date().toISOString(),
      };

      return updatedItem;
    }),
  );

  return updatedItem;
}

async function updateItems(mutator: (items: ReviewItem[]) => ReviewItem[]) {
  writeQueue = writeQueue.then(async () => {
    const items = await readItems();
    const nextItems = mutator(items);

    await fs.mkdir(dataDirectory, { recursive: true });
    await fs.writeFile(queuePath, JSON.stringify(nextItems, null, 2), "utf8");
  });

  return writeQueue;
}

async function readItems(): Promise<ReviewItem[]> {
  try {
    const file = await fs.readFile(queuePath, "utf8");
    const parsed = JSON.parse(file) as unknown;
    const result = ReviewItemListSchema.safeParse(parsed);

    if (!result.success) {
      return [];
    }

    return result.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}
