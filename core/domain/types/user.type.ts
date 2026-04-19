import { z } from "zod";
import { userSchema, updateUserSchema, createUserSchema, loginSchema, changePasswordSchema } from "../schemas/user.schema";
import { QueryParams } from "./pagination.type";

export type UserType = z.infer<typeof userSchema>;
export type CreateUserType = z.infer<typeof createUserSchema>;
export type UpdateUserType = z.infer<typeof updateUserSchema>;
export type LoginType = z.infer<typeof loginSchema>;
export type ChangePasswordType = z.infer<typeof changePasswordSchema>;

export interface UserQueryParams extends QueryParams {
  roles?: string;
}