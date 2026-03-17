/**
 * Canvas app type codes and display labels.
 * These numeric values come from the Dataverse canvasapps entity canvasapptype column.
 */
export const CANVAS_APP_TYPE_STANDARD = 0;
export const CANVAS_APP_TYPE_COMPONENT_LIBRARY = 1;
export const CANVAS_APP_TYPE_CUSTOM_PAGE = 2;

export const CANVAS_APP_TYPE_LABELS: Record<number, string> = {
  [CANVAS_APP_TYPE_STANDARD]: 'Canvas App',
  [CANVAS_APP_TYPE_COMPONENT_LIBRARY]: 'Component Library',
  [CANVAS_APP_TYPE_CUSTOM_PAGE]: 'Custom Page',
};

export function getCanvasAppTypeLabel(appType: number): string {
  return CANVAS_APP_TYPE_LABELS[appType] ?? 'Canvas App';
}
