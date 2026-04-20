// ================================================================================
// FICHIER : core/domain/schemas/user.schema.ts
// RÔLE : SOURCE DE VÉRITÉ POUR LA VALIDATION DES DONNÉES UTILISATEUR
// VERSION : 2.0 (Intégration des DTOs)
// ================================================================================

import { z } from 'zod';
import { UserRole } from '../enums/user.enum';

// Schéma pour la connexion (anciennement LoginAuthDto)
export const authSchema = z.object({
  email: z.string().email("L'adresse email est invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

// Schéma pour l'enregistrement (anciennement RegisterAuthDto)
export const registerSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  password2: z.string(),
}).refine((data) => data.password === data.password2, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["password2"],
});

// Schéma pour la mise à jour du profil (anciennement UpdateMeAuthDto)
export const updateUserProfileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(), // Le téléphone est une chaîne pour gérer les indicatifs
  description: z.string().optional(),
});

// Schéma pour la réponse de /auth/me/
export const minimalUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  phone: z.string().nullable(),
});

// Schéma pour le changement de mot de passe (anciennement ChangePasswordAuthDto)
export const changePasswordSchema = z.object({
  password: z.string().min(8),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirm_password"],
});

// Schéma pour la demande de réinitialisation de mot de passe (anciennement PasswordResetRequestAuthDto)
export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

// Schéma pour la définition d'un nouveau mot de passe (anciennement SetNewPasswordAuthDto)
export const setNewPasswordSchema = z.object({
  password: z.string().min(8),
  confirm_password: z.string(),
  uidb64: z.string(),
  token: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirm_password"],
});

// Schéma complet de l'entité User pour la validation des réponses API complètes
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string(),
  birth_date: z.string().datetime(),
  description: z.string(),
  role: z.nativeEnum(UserRole),
  is_staff: z.boolean(),
  is_superuser: z.boolean(),
  is_verified: z.boolean(),
  is_active: z.boolean(),
  date_joined: z.string().datetime(),
  last_login: z.string().datetime().nullable(),
  profile: z.object({
    file: z.object({
      id: z.string().uuid(),
      name: z.string(),
      url: z.string().url().nullable(),
      thumbnail: z.string().url().nullable(),
    }).nullable()
  }).nullable(),
});

export const userIdSchema = z.string().uuid({ message: "L'ID utilisateur fourni est invalide (doit être un UUID)." });

export const sendInvitationSchema = z.object({
  uidb64: z.string().min(1, { message: "L'UID est requis." }),
  token: z.string().min(1, { message: "Le token est requis." }),
});
