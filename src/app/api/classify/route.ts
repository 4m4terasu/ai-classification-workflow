import { classifyMessage } from "@/lib/ai/classifier";
import { createReviewItem } from "@/lib/storage/review-item-repository";
import { ClassifyRequestSchema } from "@/lib/validation/review";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const input = ClassifyRequestSchema.safeParse(body);

  if (!input.success) {
    return Response.json(
      { error: "Please provide a message between 10 and 8000 characters." },
      { status: 400 },
    );
  }

  const result = await classifyMessage(input.data.message);
  const item = await createReviewItem(input.data.message, result.classification);

  return Response.json(
    {
      item,
      provider: result.provider,
      warnings: result.warnings,
    },
    { status: 201 },
  );
}
