export type ObjectTreeItem = {
  id: string;
  label: string;
  kind: "series" | "volume" | "overlay" | "indicator" | "tool" | "pine-overlay";
  visible: boolean;
  color: string;
  removable: boolean;
};
