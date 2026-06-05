import React, { useMemo } from "react";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import { DrawingRow } from "./objectTreeRows";
import { TV } from "./objectTreePanelStyles";

type ObjectTreeDrawingListProps = {
  drawings: Drawing[];
  selectedDrawingId: string | null;
  collapsedGroups: Record<string, boolean>;
  onGroupToggle: (groupId: string) => void;
  onSelect: (id: string) => void;
  onVisibilityToggle: (id: string, hidden: boolean) => void;
  onLockToggle: (id: string, locked: boolean) => void;
  onDelete: (id: string) => void;
};

type GroupedDrawings = {
  drawingsByGroup: Record<string, Drawing[]>;
  ungroupedDrawings: Drawing[];
};

const drawingListStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
};

const emptyDrawingStateStyle: React.CSSProperties = {
  padding: "20px 14px",
  color: TV.labelColor,
  fontSize: 13,
  textAlign: "center",
  marginTop: "20px",
};

const emptyDrawingIconStyle: React.CSSProperties = {
  fontSize: 24,
  display: "block",
  marginBottom: 8,
};

const groupHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "6px 14px",
  background: "rgba(255,255,255,0.03)",
  cursor: "pointer",
};

const groupChevronStyle: React.CSSProperties = {
  fontSize: 10,
  color: TV.tabMuted,
  marginRight: 8,
};

const groupFolderStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#ff9f04",
  marginRight: 10,
};

const groupNameStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: TV.tabText,
  flex: 1,
};

const groupCountStyle: React.CSSProperties = {
  fontSize: 10,
  color: TV.tabMuted,
};

const nestedDrawingStyle: React.CSSProperties = {
  paddingLeft: 20,
};

const groupDrawings = (drawings: Drawing[]): GroupedDrawings => {
  const drawingsByGroup: Record<string, Drawing[]> = {};
  const ungroupedDrawings: Drawing[] = [];

  drawings.forEach((drawing) => {
    if (drawing.groupId) {
      if (!drawingsByGroup[drawing.groupId]) drawingsByGroup[drawing.groupId] = [];
      drawingsByGroup[drawing.groupId].push(drawing);
      return;
    }

    ungroupedDrawings.push(drawing);
  });

  return { drawingsByGroup, ungroupedDrawings };
};

export const ObjectTreeDrawingList: React.FC<ObjectTreeDrawingListProps> = ({
  drawings,
  selectedDrawingId,
  collapsedGroups,
  onGroupToggle,
  onSelect,
  onVisibilityToggle,
  onLockToggle,
  onDelete,
}) => {
  const { drawingsByGroup, ungroupedDrawings } = useMemo(() => groupDrawings(drawings), [drawings]);

  if (drawings.length === 0) {
    return (
      <div style={drawingListStyle}>
        <div style={emptyDrawingStateStyle}>
          <i className="bi bi-pencil-square" style={emptyDrawingIconStyle} />
          Aucun dessin sur le graphique.
        </div>
      </div>
    );
  }

  return (
    <div style={drawingListStyle}>
      <div role="rowgroup" aria-label="Liste des dessins">
        {Object.entries(drawingsByGroup).map(([groupId, groupDrawings]) => (
          <div key={groupId} style={{ borderBottom: TV.divider }}>
            <div onClick={() => onGroupToggle(groupId)} style={groupHeaderStyle}>
              <i className={`bi bi-chevron-${collapsedGroups[groupId] ? "right" : "down"}`} style={groupChevronStyle} />
              <i className="bi bi-folder-fill" style={groupFolderStyle} />
              <span style={groupNameStyle}>{groupId}</span>
              <span style={groupCountStyle}>({groupDrawings.length})</span>
            </div>
            {!collapsedGroups[groupId] && [...groupDrawings].reverse().map((drawing, index) => (
              <div key={drawing.id} style={nestedDrawingStyle}>
                <DrawingRow
                  drawing={drawing}
                  index={index}
                  isSelected={drawing.id === selectedDrawingId}
                  onSelect={onSelect}
                  onVisibilityToggle={onVisibilityToggle}
                  onLockToggle={onLockToggle}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        ))}

        {[...ungroupedDrawings].reverse().map((drawing, reverseIndex) => {
          const originalIndex = ungroupedDrawings.length - 1 - reverseIndex;

          return (
            <DrawingRow
              key={drawing.id}
              drawing={drawing}
              index={originalIndex}
              isSelected={drawing.id === selectedDrawingId}
              onSelect={onSelect}
              onVisibilityToggle={onVisibilityToggle}
              onLockToggle={onLockToggle}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </div>
  );
};
