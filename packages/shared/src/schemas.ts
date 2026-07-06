import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSchema = z.object({
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  pinnedSongIds: z.array(z.string().uuid()).max(4).optional(),
  pinnedAlbumIds: z.array(z.string().uuid()).max(5).optional(),
  pinnedArtistIds: z.array(z.string().uuid()).max(5).optional(),
});

export const createLogSchema = z.object({
  songId: z.string().uuid(),
  rating: z.number().min(0.5).max(5).multipleOf(0.5).nullable().optional(),
  review: z.string().max(5000).nullable().optional(),
  loggedAt: z.string().datetime().optional(),
});

export const updateLogSchema = z.object({
  rating: z.number().min(0.5).max(5).multipleOf(0.5).nullable().optional(),
  review: z.string().max(5000).nullable().optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment can't be empty").max(1000),
});

export const createListSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).nullable().optional(),
});

export const updateListSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
});

export const addListItemSchema = z.object({
  songId: z.string().uuid(),
});

export const reorderListItemsSchema = z.object({
  songIds: z.array(z.string().uuid()).min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateLogInput = z.infer<typeof createLogSchema>;
export type UpdateLogInput = z.infer<typeof updateLogSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type AddListItemInput = z.infer<typeof addListItemSchema>;
export type ReorderListItemsInput = z.infer<typeof reorderListItemsSchema>;
