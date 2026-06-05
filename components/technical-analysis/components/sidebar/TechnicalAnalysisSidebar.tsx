import React from "react";
import clsx from "clsx";
import type { TechnicalAnalysisSidebarProps } from "./TechnicalAnalysisSidebar.types";
import { TechnicalAnalysisSidebarContent } from "./TechnicalAnalysisSidebarContent";
import { useSidebarCharts } from "./hooks/useSidebarCharts";
import { useTechnicalAnalysisSidebarController } from "./hooks/useTechnicalAnalysisSidebarController";

export type { TechnicalAnalysisSidebarProps } from "./TechnicalAnalysisSidebar.types";

export const TechnicalAnalysisSidebar: React.FC<TechnicalAnalysisSidebarProps> = (props) => {
  const controller = useTechnicalAnalysisSidebarController(props);
  useSidebarCharts(controller.chartConfig);

  return (
    <aside
      ref={props.sidebarRef as React.RefObject<HTMLDivElement>}
      className={clsx("gp-sidebar", "gsap-target-sidebar", "animated-element")}
      style={{ position: "relative" }}
    >
      <TechnicalAnalysisSidebarContent controller={controller} />
    </aside>
  );
};

export default TechnicalAnalysisSidebar;
