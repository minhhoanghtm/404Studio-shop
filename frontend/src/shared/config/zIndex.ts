/**
 * Z-INDEX CONTRACT HIERARCHY
 * Centralized layering contract for Atelier Vérité / 404Studio
 * 
 * Hierarchy:
 * - base: 0 (default in-flow layout)
 * - sticky header / ticker: 50
 * - dropdown / tooltip / popover: 60
 * - drawer overlay: 90
 * - drawer content: 100
 * - modal overlay base: 110
 * - modal content base: 120
 * - chat widget: 130
 * - toast container: 200
 * - page transition overlay: 300
 */
export const Z_INDEX = {
  base: 0,
  sticky: 50,
  dropdown: 60,
  tooltip: 60,
  drawerOverlay: 90,
  drawer: 100,
  modalOverlayBase: 110,
  modalBase: 120,
  chatWidget: 130,
  toast: 200,
  pageTransition: 300,
} as const;

export type ZIndexTier = keyof typeof Z_INDEX;
