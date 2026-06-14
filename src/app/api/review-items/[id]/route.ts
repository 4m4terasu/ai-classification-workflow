import { updateReviewItem } from "@/lib/storage/review-item-repository";
import { ReviewItemUpdateSchema } from "@/lib/validation/review";

export async function PATCH(request: Request, context: RouteContext<"/api/review-items/[id]">) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as unknown;
  const input = ReviewItemUpdateSchema.safeParse(body);

  if (!input.success) {
    return Response.json({ error: "Invalid review item update." }, { status: 400 });
  }

  const item = await updateReviewItem(id, input.data);

  if (!item) {
    return Response.json({ error: "Review item not found." }, { status: 404 });
  }

  return Response.json({ item });
}
