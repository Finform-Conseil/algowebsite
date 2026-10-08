import React from "react";
import clsx from "clsx";

export const FLOATING_TOOLBAR_BUTTON_SIZE_PX = 32;
export const FLOATING_TOOLBAR_HEIGHT_PX = 42;
export const FLOATING_TOOLBAR_GAP_PX = 2;
export const FLOATING_TOOLBAR_HORIZONTAL_PADDING_PX = 6;
export const FLOATING_TOOLBAR_DRAG_SLOT_WIDTH_PX = 26;

type FloatingToolbarShellProps = React.HTMLAttributes<HTMLDivElement>;

export const FloatingToolbarShell = React.forwardRef<HTMLDivElement, FloatingToolbarShellProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx("gp-floating-toolbar-shell", className)} {...props} />
  ),
);

FloatingToolbarShell.displayName = "FloatingToolbarShell";

type FloatingToolbarDragHandleProps = React.HTMLAttributes<HTMLDivElement> & {
  showSeparator?: boolean;
};

export const FloatingToolbarDragHandle: React.FC<FloatingToolbarDragHandleProps> = ({
  className,
  showSeparator = true,
  ...props
}) => (
  <>
    <div
      className={clsx("gp-floating-toolbar-drag-handle", className)}
      data-toolbar-drag-handle="true"
      {...props}
    >
      {[...Array(6)].map((_, index) => (
        <span key={index} className="gp-floating-toolbar-drag-dot" />
      ))}
    </div>
    {showSeparator && <span className="gp-floating-toolbar-separator" aria-hidden="true" />}
  </>
);
