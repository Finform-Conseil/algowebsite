// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/math/geometry.ts

/**
 * Calcule la distance la plus courte entre un point (px, py) et un segment de ligne (x1,y1) -> (x2,y2).
 * Gère les extensions infinies (rayons, lignes étendues).
 */
export const distToSegment = (
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
  extendLeft = false, extendRight = false
): number => {
  const l2 = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
  if (l2 === 0) return Math.sqrt(Math.pow(px - x1, 2) + Math.pow(py - y1, 2));
  
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  
  const minT = extendLeft ? -10000 : 0;
  const maxT = extendRight ? 10000 : 1;
  t = Math.max(minT, Math.min(maxT, t));
  
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  
  return Math.sqrt(Math.pow(px - projX, 2) + Math.pow(py - projY, 2));
};

/**
 * [TENOR 2026 HDR] Produit vectoriel 2D (Cross Product) pour déterminer de quel côté d'une ligne se trouve un point.
 * Retourne > 0 si p2 est à gauche de la ligne p0->p1
 * Retourne = 0 si p2 est sur la ligne
 * Retourne < 0 si p2 est à droite de la ligne
 * Note: Sur un Canvas, l'axe Y est inversé (vers le bas), ce qui inverse l'interprétation visuelle gauche/droite,
 * mais la logique topologique reste mathématiquement pure.
 */
const isLeft = (p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }): number => {
  return ((p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y));
};

/**
 * [TENOR 2026 HDR] Algorithme du Winding Number (Indice d'Enlacement).
 * Remplace l'ancien algorithme de Ray-Casting.
 * Topologiquement robuste pour les polygones complexes, concaves et auto-intersectants (Bowties).
 * Indispensable pour le hit-testing des zones pleines (Fill) des outils de trading avancés.
 */
export const isPointInPolygon = (px: number, py: number, polygon: { x: number, y: number }[]): boolean => {
  if (polygon.length < 3) return false;
  
  let windingNumber = 0;
  const pt = { x: px, y: py };

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length]; // Boucle implicite vers le premier point

    if (p1.y <= py) {
      // Règle de croisement vers le haut
      if (p2.y > py && isLeft(p1, p2, pt) > 0) {
        windingNumber++;
      }
    } else {
      // Règle de croisement vers le bas
      if (p2.y <= py && isLeft(p1, p2, pt) < 0) {
        windingNumber--;
      }
    }
  }
  
  // Si le winding number est différent de 0, le point est strictement à l'intérieur
  return windingNumber !== 0;
};

/**
 * [TENOR 2026 HDR] Coordonnées Barycentriques pour un test de collision ultra-rapide sur les triangles.
 * Complexité O(1), Zéro allocation mémoire.
 * Idéal pour les patterns harmoniques (XABCD, Cypher, Three Drives, etc.).
 */
export const isPointInTriangle = (px: number, py: number, p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }): boolean => {
  const denominator = ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
  
  // Protection contre la division par zéro (Triangle dégénéré / Points alignés)
  if (denominator === 0) return false; 
  
  const a = ((p2.y - p3.y) * (px - p3.x) + (p3.x - p2.x) * (py - p3.y)) / denominator;
  const b = ((p3.y - p1.y) * (px - p3.x) + (p1.x - p3.x) * (py - p3.y)) / denominator;
  const c = 1 - a - b;
  
  // Le point est à l'intérieur si et seulement si toutes les coordonnées barycentriques sont entre 0 et 1
  return 0 <= a && a <= 1 && 0 <= b && b <= 1 && 0 <= c && c <= 1;
};

/**
 * Calcule la distance euclidienne entre deux points.
 */
export const distanceBetweenPoints = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.hypot(x2 - x1, y2 - y1);
};

/**
 * Vérifie si un point est dans un rectangle aligné avec les axes.
 */
export const isPointInRect = (px: number, py: number, xMin: number, xMax: number, yMin: number, yMax: number): boolean => {
  return px >= xMin && px <= xMax && py >= yMin && py <= yMax;
};

/**
 * Calcule la longueur de la diagonale d'un rectangle défini par deux points.
 */
export const diagonal = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

/**
 * Projette un point sur une ligne définie par deux points avec un ratio.
 * Utile pour les niveaux Fibonacci, Gann, etc.
 */
export const projectPoint = (x1: number, y1: number, x2: number, y2: number, ratio: number): { x: number, y: number } => {
  return { x: x1 + (x2 - x1) * ratio, y: y1 + (y2 - y1) * ratio };
};

/**
 * Calcule l'angle en radians entre deux points (vecteur de (x1,y1) vers (x2,y2)).
 */
export const angleBetweenPoints = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.atan2(y2 - y1, x2 - x1);
};

/**
 * Calcule l'intersection de deux segments de ligne (optionnel avec extensions infinies).
 */
export const lineIntersection = (
  x1: number, y1: number, x2: number, y2: number, // Ligne 1
  x3: number, y3: number, x4: number, y4: number, // Ligne 2
  extend1 = false, extend2 = false
): { x: number, y: number } | null => {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null; // Parallèles

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (!extend1 && (t < 0 || t > 1)) return null;
  if (!extend2 && (u < 0 || u > 1)) return null;

  return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
};

/**
 * Calcule une valeur projetée linéairement entre deux points selon un ratio.
 */
export const linearValue = (v1: number, v2: number, ratio: number): number => {
  return v1 + ratio * (v2 - v1);
};

/**
 * Calcule une valeur projetée sur une échelle logarithmique entre deux points.
 * Utile pour les outils d'analyse technique sur graphiques log.
 */
export const logValue = (v1: number, v2: number, ratio: number): number => {
  if (v1 <= 0 || v2 <= 0) return linearValue(v1, v2, ratio);
  return Math.exp(Math.log(v1) + ratio * (Math.log(v2) - Math.log(v1)));
};

/**
 * Étend un segment [p1, p2] vers l'infini (rayon) avec une longueur donnée.
 */
export const extendToRay = (p1: { x: number, y: number }, p2: { x: number, y: number }, length = 10000): { x: number, y: number } => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return p2;
  return { x: p1.x + (dx / mag) * length, y: p1.y + (dy / mag) * length };
};

/**
 * Calcule l'origine déplacée pour les variantes de Pitchfork (Schiff, Modified Schiff, Inside).
 */
export const calculatePitchforkOrigin = (
  p1: { x: number, y: number },
  p2: { x: number, y: number },
  style: "schiff" | "modified_schiff" | "inside",
  pMid?: { x: number, y: number }
): { x: number, y: number } => {
  if (style === "schiff") {
    return { x: p1.x, y: (p1.y + p2.y) / 2 };
  } else if (style === "modified_schiff") {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  } else if (style === "inside" && pMid) {
    return { x: (p1.x + pMid.x) / 2, y: (p1.y + pMid.y) / 2 };
  }
  return p1;
};

/**
 * Calcule le rayon d'une spirale de Fibonacci à un angle donné.
 * PHI = 1.618033988749895
 */
export const calculateFibSpiralRadius = (rBase: number, thetaStart: number, currentAngle: number, direction: number): number => {
  const PHI = 1.618033988749895;
  let deltaTheta = (currentAngle - thetaStart) * direction;
  while (deltaTheta < 0) deltaTheta += 2 * Math.PI;
  // La formule standard : r = a * e^(b*theta)
  // Pour Fib: r = rBase * PHI^(2 * deltaTheta / PI)
  return rBase * Math.pow(PHI, (2 * deltaTheta) / Math.PI);
};

/**
 * Calcule l'interpolation (rayon et angle) pour un coin (Wedge) entre deux rayons.
 */
export const interpolateWedge = (
  mx: number, my: number,
  p1: { x: number, y: number },
  r1: number, r2: number,
  a1: number, a2: number
): { isInside: boolean, ratio: number, expectedRadius: number, mouseR: number } => {
  let deltaA = a2 - a1;
  while (deltaA > Math.PI) deltaA -= 2 * Math.PI;
  while (deltaA <= -Math.PI) deltaA += 2 * Math.PI;

  const mouseR = Math.hypot(mx - p1.x, my - p1.y);
  const mouseA = Math.atan2(my - p1.y, mx - p1.x);

  let relA = mouseA - a1;
  while (relA > Math.PI) relA -= 2 * Math.PI;
  while (relA <= -Math.PI) relA += 2 * Math.PI;

  const isInside = (deltaA >= 0) ? (relA >= 0 && relA <= deltaA) : (relA <= 0 && relA >= deltaA);
  const ratio = deltaA !== 0 ? relA / deltaA : 0;
  const expectedRadius = r1 + ratio * (r2 - r1);

  return { isInside, ratio, expectedRadius, mouseR };
};

/**
 * Calcule une régression linéaire simple (Ordinary Least Squares).
 */
export const calculateLinearRegression = (xValues: number[], yValues: number[]): { slope: number, intercept: number, r: number, stdDev: number } => {
  const n = xValues.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

  for (let i = 0; i < n; i++) {
    sumX += xValues[i];
    sumY += yValues[i];
    sumXY += xValues[i] * yValues[i];
    sumXX += xValues[i] * xValues[i];
    sumYY += yValues[i] * yValues[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const r = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  let sumResidualSq = 0;
  for (let i = 0; i < n; i++) {
    const expected = slope * xValues[i] + intercept;
    sumResidualSq += Math.pow(yValues[i] - expected, 2);
  }
  const stdDev = Math.sqrt(sumResidualSq / n);

  return { slope, intercept, r, stdDev };
};

/**
 * Calcule les statistiques de position (Ratio R:R, Risque en %, etc.).
 */
export const calculatePositionStats = (entryPrice: number, tpPrice: number, slPrice: number) => {
  const risk = Math.abs(entryPrice - slPrice);
  const reward = Math.abs(tpPrice - entryPrice);
  const ratio = risk > 0 ? reward / risk : 0;
  const riskPercent = (risk / entryPrice) * 100;
  const rewardPercent = (reward / entryPrice) * 100;

  return { risk, reward, ratio, riskPercent, rewardPercent };
};