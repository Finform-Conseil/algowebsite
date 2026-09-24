export type ObjectTreeItemCapabilities = {
  visibility: boolean;
  remove: boolean;
};

export type ObjectTreeItem = {
  id: string;
  label: string;
  kind: "series" | "volume" | "overlay" | "indicator" | "tool" | "pine-overlay" | "alert" | "order";
  visible: boolean;
  color: string;
  removable: boolean;
  comparisonKey?: string;
  runtimeOnly?: boolean;
  capabilities?: ObjectTreeItemCapabilities;
};
