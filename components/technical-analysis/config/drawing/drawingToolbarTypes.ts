export interface ToolbarButtonDefinition {
  icon: string;
  iconLocked?: string;
  title: string;
  action: string;
}

export interface ToolbarDrawingConfig {
  toolbar: string[];
  description?: string;
}

export interface ToolbarConfig {
  version: string;
  description: string;
  drawings: Record<string, ToolbarDrawingConfig>;
  button_definitions: Record<string, ToolbarButtonDefinition>;
}
