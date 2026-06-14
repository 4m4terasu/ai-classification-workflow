import { z } from "zod";

export const categories = [
  "billing",
  "technical_issue",
  "account",
  "feature_request",
  "complaint",
  "sales",
  "spam",
  "other",
] as const;

export const priorities = ["low", "medium", "high", "urgent"] as const;

export const statuses = ["pending", "approved", "rejected"] as const;

export const CategorySchema = z.enum(categories);
export const PrioritySchema = z.enum(priorities);
export const ReviewStatusSchema = z.enum(statuses);

export const ClassificationSchema = z
  .object({
    category: CategorySchema,
    priority: PrioritySchema,
    confidence: z.number().min(0).max(1),
    summary: z.string().trim().min(1).max(240),
    suggestedReply: z.string().trim().min(1).max(1200),
    reasoning: z.string().trim().min(1).max(500),
  })
  .strict();

export const ClassifyRequestSchema = z
  .object({
    message: z.string().trim().min(10).max(8000),
  })
  .strict();

export const ReviewItemSchema = ClassificationSchema.extend({
  id: z.string().min(1),
  originalMessage: z.string().min(1),
  status: ReviewStatusSchema,
  reviewerNote: z.string().max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

export const ReviewItemListSchema = z.array(ReviewItemSchema);

export const ReviewItemUpdateSchema = z
  .object({
    category: CategorySchema.optional(),
    priority: PrioritySchema.optional(),
    suggestedReply: z.string().trim().min(1).max(1200).optional(),
    reviewerNote: z.string().trim().max(1000).optional(),
    status: ReviewStatusSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

export type Category = z.infer<typeof CategorySchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export type Classification = z.infer<typeof ClassificationSchema>;
export type ReviewItem = z.infer<typeof ReviewItemSchema>;
export type ReviewItemUpdate = z.infer<typeof ReviewItemUpdateSchema>;
