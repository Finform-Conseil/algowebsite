import { ToolSpec, ToolGroup, DrawingAction, Drawing, DrawingPoint } from '@/types/drawingTools';

// ============================================================================
// TOOL SPECIFICATIONS
// ============================================================================

export const TOOL_SPECS: Record<string, ToolSpec> = {
  // CURSORS GROUP
  cursor: {
    id: 'cursor',
    label: 'Curseur',
    groupId: 'cursors',
    icon: 'cursor',
    pointsNeeded: 0,
    defaultStyle: { color: '#FFFFFF', lineWidth: 1 },
    create: () => {
      throw new Error('Cursor tool does not create drawings');
    },
  },
  cross: {
    id: 'cross',
    label: 'Croix',
    groupId: 'cursors',
    icon: 'crosshair',
    pointsNeeded: 0,
    defaultStyle: { color: '#FFFFFF', lineWidth: 1 },
    create: () => {
      throw new Error('Cross cursor does not create drawings');
    },
  },

  // TREND LINE TOOLS GROUP
  trendLine: {
    id: 'trendLine',
    label: 'Ligne de tendance',
    groupId: 'trendLine',
    icon: 'trending-up',
    pointsNeeded: 2,
    defaultStyle: { color: '#00BFFF', lineWidth: 2 },
    create: (points) => ({
      id: `drawing-${Date.now()}`,
      type: 'trendLine',
      points,
      style: { color: '#00BFFF', lineWidth: 2 },
      locked: false,
      visible: true,
    }),
  },
  ray: {
    id: 'ray',
    label: 'Rayon',
    groupId: 'trendLine',
    icon: 'arrow-right',
    pointsNeeded: 2,
    defaultStyle: { color: '#2196F3', lineWidth: 2 },
    create: (points) => ({
      id: `drawing-${Date.now()}`,
      type: 'ray',
      points,
      style: { color: '#2196F3', lineWidth: 2 },
      locked: false,
      visible: true,
    }),
  },
  horizontalLine: {
    id: 'horizontalLine',
    label: 'Ligne horizontale',
    groupId: 'trendLine',
    icon: 'minus',
    pointsNeeded: 1,
    defaultStyle: { color: '#FFD700', lineWidth: 2 },
    create: (points) => ({
      id: `drawing-${Date.now()}`,
      type: 'horizontalLine',
      points,
      style: { color: '#FFD700', lineWidth: 2 },
      locked: false,
      visible: true,
    }),
  },
  verticalLine: {
    id: 'verticalLine',
    label: 'Ligne verticale',
    groupId: 'trendLine',
    icon: 'separator-vertical',
    pointsNeeded: 1,
    defaultStyle: { color: '#9B59B6', lineWidth: 2 },
    create: (points) => ({
      id: `drawing-${Date.now()}`,
      type: 'verticalLine',
      points,
      style: { color: '#9B59B6', lineWidth: 2 },
      locked: false,
      visible: true,
    }),
  },
  crossLine: {
    id: 'crossLine',
    label: 'Croix',
    groupId: 'trendLine',
    icon: 'plus',
    pointsNeeded: 1,
    defaultStyle: { color: '#FFFFFF', lineWidth: 1 },
    create: (points) => ({
      id: `drawing-${Date.now()}`,
      type: 'crossLine',
      points,
      style: { color: '#FFFFFF', lineWidth: 1 },
      locked: false,
      visible: true,
    }),
  },

  // GEOMETRIC SHAPES GROUP
  rectangle: {
    id: 'rectangle',
    label: 'Rectangle',
    groupId: 'shapes',
    icon: 'square',
    pointsNeeded: 2,
    defaultStyle: { color: '#4CAF50', lineWidth: 2, fill: '#4CAF50', fillOpacity: 0.1 },
    create: (points) => ({
      id: `drawing-${Date.now()}`,
      type: 'rectangle',
      points,
      style: { color: '#4CAF50', lineWidth: 2, fill: '#4CAF50', fillOpacity: 0.1 },
      locked: false,
      visible: true,
    }),
  },
  circle: {
    id: 'circle',
    label: 'Cercle',
    groupId: 'shapes',
    icon: 'circle',
    pointsNeeded: 2,
    defaultStyle: { color: '#FF9800', lineWidth: 2, fill: '#FF9800', fillOpacity: 0.1 },
    create: (points) => ({
      id: `drawing-${Date.now()}`,
      type: 'circle',
      points,
      style: { color: '#FF9800', lineWidth: 2, fill: '#FF9800', fillOpacity: 0.1 },
      locked: false,
      visible: true,
    }),
  },
  ellipse: {
    id: 'ellipse',
    label: 'Ellipse',
    groupId: 'shapes',
    icon: 'circle',
    pointsNeeded: 2,
    defaultStyle: { color: '#E91E63', lineWidth: 2, fill: '#E91E63', fillOpacity: 0.1 },
    create: (points) => ({
      id: `drawing-${Date.now()}`,
      type: 'ellipse',
      points,
      style: { color: '#E91E63', lineWidth: 2, fill: '#E91E63', fillOpacity: 0.1 },
      locked: false,
      visible: true,
    }),
  },

  // ANNOTATION GROUP
  text: {
    id: 'text',
    label: 'Texte',
    groupId: 'annotation',
    icon: 'type',
    pointsNeeded: 1,
    defaultStyle: { color: '#FFFFFF', lineWidth: 1 },
    create: (points, meta) => ({
      id: `drawing-${Date.now()}`,
      type: 'text',
      points,
      style: { color: '#FFFFFF', lineWidth: 1 },
      locked: false,
      visible: true,
      meta: { text: meta?.text || 'Text' },
    }),
  },

  // LEGACY SUPPORT (support/resistance)
  support: {
    id: 'support',
    label: 'Support',
    groupId: 'trendLine',
    icon: 'arrow-up',
    pointsNeeded: 1,
    defaultStyle: { color: '#28a745', lineWidth: 2, lineDash: [5, 5] },
    create: (points) => ({
      id: `drawing-${Date.now()}`,
      type: 'support',
      points,
      style: { color: '#28a745', lineWidth: 2, lineDash: [5, 5] },
      locked: false,
      visible: true,
    }),
  },
  resistance: {
    id: 'resistance',
    label: 'Résistance',
    groupId: 'trendLine',
    icon: 'arrow-down',
    pointsNeeded: 1,
    defaultStyle: { color: '#dc3545', lineWidth: 2, lineDash: [5, 5] },
    create: (points) => ({
      id: `drawing-${Date.now()}`,
      type: 'resistance',
      points,
      style: { color: '#dc3545', lineWidth: 2, lineDash: [5, 5] },
      locked: false,
      visible: true,
    }),
  },
};

// ============================================================================
// TOOL GROUPS
// ============================================================================

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'cursors',
    label: 'Curseurs',
    icon: 'cursor',
    tools: ['cursor', 'cross'],
  },
  {
    id: 'trendLine',
    label: 'Lignes de tendance',
    icon: 'trending-up',
    tools: ['trendLine', 'ray', 'horizontalLine', 'verticalLine', 'crossLine', 'support', 'resistance'],
  },
  {
    id: 'shapes',
    label: 'Formes géométriques',
    icon: 'square',
    tools: ['rectangle', 'circle', 'ellipse'],
  },
  {
    id: 'annotation',
    label: 'Annotations',
    icon: 'type',
    tools: ['text'],
  },
];

// ============================================================================
// DRAWING ACTIONS
// ============================================================================

export const DRAWING_ACTIONS: DrawingAction[] = [
  {
    id: 'magnet',
    label: 'Aimant',
    icon: 'magnet',
    type: 'toggle',
  },
  {
    id: 'stayDrawing',
    label: 'Rester en mode dessin',
    icon: 'pin',
    type: 'toggle',
  },
  {
    id: 'lock',
    label: 'Verrouiller',
    icon: 'lock',
    type: 'toggle',
  },
  {
    id: 'hide',
    label: 'Masquer',
    icon: 'eye-off',
    type: 'toggle',
  },
  {
    id: 'remove',
    label: 'Supprimer tout',
    icon: 'trash-2',
    type: 'button',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getToolSpec(toolId: string): ToolSpec | undefined {
  return TOOL_SPECS[toolId];
}

export function getToolGroup(groupId: string): ToolGroup | undefined {
  return TOOL_GROUPS.find(g => g.id === groupId);
}

export function getToolsByGroup(groupId: string): ToolSpec[] {
  const group = getToolGroup(groupId);
  if (!group) return [];
  return group.tools.map(toolId => TOOL_SPECS[toolId]).filter(Boolean);
}
