// ================================================================================
// FICHIER : core/infrastructure/security/recaptcha/verifyRecaptchaToken.ts
// RÔLE : Validation côté serveur du token reCAPTCHA v3
// VERSION : 1.0.0
// ================================================================================

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

interface VerifyResult {
  success: boolean;
  score: number;
  message: string;
}

/**
 * 🛡️ Vérifie un token reCAPTCHA v3 auprès de l'API Google
 * 
 * @param token - Le token reCAPTCHA reçu du client
 * @param expectedAction - L'action attendue (ex: "signin", "signup")
 * @param minScore - Score minimum requis (0.0-1.0, défaut: 0.5)
 * @returns Résultat de la vérification avec le score
 */
export async function verifyRecaptchaToken(
  token: string,
  expectedAction: string,
  minScore: number = 0.5
): Promise<VerifyResult> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // En développement sans clé, on laisse passer
  if (!secretKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[reCAPTCHA] ⚠️ RECAPTCHA_SECRET_KEY non définie. Validation désactivée en dev.');
      return { success: true, score: 1.0, message: 'Dev mode - validation skipped' };
    }
    return { success: false, score: 0, message: 'Configuration reCAPTCHA manquante sur le serveur' };
  }

  // Token de développement (bypass)
  if (token === 'DEV_MODE_NO_TOKEN' || token === 'DEV_BYPASS_RECAPTCHA_TOKEN') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[reCAPTCHA] 🔧 Token de bypass détecté - validation ignorée en dev');
      return { success: true, score: 1.0, message: 'Dev mode - token bypass' };
    }
    return { success: false, score: 0, message: 'Token invalide' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    if (!response.ok) {
      console.error('[reCAPTCHA] Erreur API Google:', response.status);
      return { success: false, score: 0, message: 'Erreur de communication avec reCAPTCHA' };
    }

    const data: RecaptchaVerifyResponse = await response.json();

    // Logging pour debug (à désactiver en production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[reCAPTCHA] Réponse Google:', {
        success: data.success,
        score: data.score,
        action: data.action,
        expectedAction,
      });
    }

    if (!data.success) {
      return {
        success: false,
        score: 0,
        message: `Vérification reCAPTCHA échouée: ${data['error-codes']?.join(', ') || 'Unknown'}`,
      };
    }

    // Vérifier l'action (optionnel mais recommandé)
    if (expectedAction && data.action !== expectedAction) {
      console.warn('[reCAPTCHA] Action mismatch:', { expected: expectedAction, received: data.action });
      // On ne bloque pas pour éviter les faux positifs, mais on log
    }

    // Vérifier le score (v3 uniquement)
    const score = data.score ?? 0;
    if (score < minScore) {
      return {
        success: false,
        score,
        message: `Score reCAPTCHA trop bas: ${score} (minimum: ${minScore})`,
      };
    }

    return { success: true, score, message: 'Vérification réussie' };
  } catch (error) {
    console.error('[reCAPTCHA] Erreur lors de la vérification:', error);
    return { success: false, score: 0, message: 'Erreur lors de la vérification reCAPTCHA' };
  }
}
