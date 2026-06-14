import { listReviewItems } from "@/lib/storage/review-item-repository";
import { CategorySchema, PrioritySchema, ReviewStatusSchema } from "@/lib/validation/review";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const status = parseOptionalFilter(ReviewStatusSchema, searchParams.get("status"));
  const category = parseOptionalFilter(CategorySchema, searchParams.get("category"));
  const priority = parseOptionalFilter(PrioritySchema, searchParams.get("priority"));

  if (status === null || category === null || priority === null) {
    return Response.json({ error: "One or more filters are invalid." }, { status: 400 });
  }

  const items = await listReviewItems({
    status,
    category,
    priority,
  });

  return Response.json({ items });
}

function parseOptionalFilter<T>(schema: { safeParse: (value: unknown) => { success: boolean; data?: T } }, value: string | null) {
  if (!value) {
    return undefined;
  }

  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}
