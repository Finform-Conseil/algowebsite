import { z } from 'zod';
import { UserRoleEnum } from '../enums/user.enum';

const isFile = (value: any) =>
  typeof File !== "undefined" && value instanceof File;

export const loginSchema = z.object({
  email: z.email({
    message: "L'email est requis",
  }),
  password: z.string().min(8, {
    message: "Le mot de passe doit être d'au moins 8 caractères",
  }),
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(8, {
    message: "Le mot de passe doit être d'au moins 8 caractères",
  }),
  new_password: z.string().min(8, {
    message: "Le mot de passe doit être d'au moins 8 caractères",
  }),
});

export const userSchema = z.object({
    id: z.string(),
    first_name: z.string().min(1, "Firstname is required").max(100, "Firstname must be less than 100 characters"),
    last_name: z.string().min(1, "Lastname is required").max(100, "Lastname must be less than 100 characters"),
    email: z.email("Email invalide"),
    phone: z.string().optional(),
    matricule: z.string().optional(),
    roles: z.array(z.enum([UserRoleEnum.ADMIN, UserRoleEnum.UTILISATEUR, UserRoleEnum.VALIDATEUR, UserRoleEnum.RESPONSABLE_STRUCTURE])),
    profile: z
        .any()
        .refine((file) => !file || isFile(file), "Le fichier doit être un fichier valide.")
        .refine((file) => !file || file.size <= 2_000_000, "La taille du fichier doit être inférieure à 2MB")
        .refine((file) => !file || file.type.startsWith("image/"), "Le fichier doit être une image")
        .optional(),
});


export const createUserSchema = userSchema
  .omit({ id: true })
  .extend({
    password: z.string().min(8, {
      message: "Le mot de passe doit être d'au moins 8 caractères",
    }),
    password2: z.string().min(8, {
      message: "Le mot de passe doit être d'au moins 8 caractères",
    }),
  })
  .refine((data) => data.password === data.password2, {
    path: ["password2"],
    message: "Les mots de passe ne correspondent pas",
  });


export const updateUserSchema = userSchema.partial();
