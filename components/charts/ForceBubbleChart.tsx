'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceCenter,
  forceCollide,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  SimulationNodeDatum,
} from 'd3-force';
import { TreemapNode } from './TreemapChart';

interface BubbleNode extends SimulationNodeDatum {
  id: string;
  name: string;
  value: number;
  changePct: number;
  group: string;
  radius: number;
}

interface ForceBubbleChartProps {
  data: TreemapNode[];
  height?: string;
  positiveColor?: string;
  negativeColor?: string;
  neutralColor?: string;
}

export default function ForceBubbleChart({
  data,
  height = '100%',
  positiveColor = '#10b981',
  negativeColor = '#ef4444',
  neutralColor = '#6b7280',
}: ForceBubbleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [nodes, setNodes] = useState<BubbleNode[]>([]);

  const flattened = useMemo<BubbleNode[]>(() => {
    const bubbles: BubbleNode[] = [];
    let idCounter = 0;

    data.forEach((groupNode) => {
      const group = groupNode.name || 'Unknown';
      const children = groupNode.children;

      if (children && children.length > 0) {
        children.forEach((child) => {
          bubbles.push({
            id: `bubble-${group}-${idCounter}`,
            name: child.name || '',
            value: child.value?.[0] ?? 0,
            changePct: child.value?.[2] ?? 0,
            group,
            radius: 0,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
          });
          idCounter += 1;
        });
      } else {
        bubbles.push({
          id: `bubble-${group}-${idCounter}`,
          name: group,
          value: groupNode.value?.[0] ?? 0,
          changePct: groupNode.value?.[2] ?? 0,
          group,
          radius: 0,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
        });
        idCounter += 1;
      }
    });

    return bubbles;
  }, [data]);

  useEffect(() => {
    if (flattened.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
      setNodes([]);
      return;
    }

    const width = dimensions.width;
    const height = dimensions.height;
    const minDim = Math.min(width, height);

    const totalValue = flattened.reduce((sum, d) => sum + d.value, 0) || 1;
    const containerArea = width * height;
    const targetBubbleArea = containerArea * 0.55;
    const scaleFactor = Math.sqrt(targetBubbleArea / (Math.PI * totalValue));

    const nodesWithRadius = flattened.map((d) => ({
      ...d,
      radius: Math.max(4, Math.min(minDim / 10, Math.sqrt(d.value) * scaleFactor)),
    }));

    const groups = Array.from(new Set(nodesWithRadius.map((d) => d.group)));
    const groupCenters = computeGroupCenters(groups, width, height);

    const simulation = forceSimulation<BubbleNode>(nodesWithRadius)
      .force('charge', forceManyBody<BubbleNode>().strength((d) => -d.radius * 1.5))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide<BubbleNode>().radius((d) => d.radius + 1).strength(0.7));

    if (groups.length > 1) {
      simulation
        .force('groupX', forceX<BubbleNode>((d) => groupCenters[d.group]?.x ?? width / 2).strength(0.08))
        .force('groupY', forceY<BubbleNode>((d) => groupCenters[d.group]?.y ?? height / 2).strength(0.08));
    }

    simulation.on('tick', () => {
      setNodes([...nodesWithRadius]);
    });

    simulation.on('end', () => {
      setNodes([...nodesWithRadius]);
    });

    return () => {
      simulation.stop();
    };
  }, [flattened, dimensions]);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    const updateDimensions = () => {
      const rect = element.getBoundingClientRect();
      setDimensions({
        width: rect.width,
        height: rect.height,
      });
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  const getColor = (changePct: number) => {
    if (changePct > 0) return positiveColor;
    if (changePct < 0) return negativeColor;
    return neutralColor;
  };

  const formatValue = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const truncateName = (name: string, radius: number) => {
    const maxChars = Math.max(3, Math.floor(radius / 3));
    if (name.length <= maxChars) return name;
    return `${name.slice(0, maxChars)}...`;
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--card-background, #102A43)',
      }}
    >
      {nodes.length > 0 ? (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          style={{ display: 'block' }}
        >
          {nodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}>
              <circle
                r={node.radius}
                fill={getColor(node.changePct)}
                fillOpacity={0.85}
                stroke="#ffffff"
                strokeWidth={1}
                strokeOpacity={0.3}
                style={{ transition: 'fill 0.2s ease' }}
              />
              {node.radius > 12 && (
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontSize={Math.min(12, node.radius / 2)}
                  fontWeight={600}
                  pointerEvents="none"
                >
                  {truncateName(node.name, node.radius)}
                </text>
              )}
              <title>{`${node.name} (${node.group})\nMarket Cap: $${formatValue(node.value)}\nChange: ${node.changePct.toFixed(2)}%`}</title>
            </g>
          ))}
        </svg>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted, #888888)',
          }}
        >
          No data
        </div>
      )}
    </div>
  );
}

function computeGroupCenters(
  groups: string[],
  width: number,
  height: number
): Record<string, { x: number; y: number }> {
  const centers: Record<string, { x: number; y: number }> = {};
  const cols = Math.ceil(Math.sqrt(groups.length));
  const rows = Math.ceil(groups.length / cols);
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  groups.forEach((group, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    centers[group] = {
      x: cellWidth * col + cellWidth / 2,
      y: cellHeight * row + cellHeight / 2,
    };
  });

  return centers;
}
