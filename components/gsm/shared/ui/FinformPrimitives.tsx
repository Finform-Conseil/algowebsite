import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from 'react';

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type PolymorphicProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

type FinformCardProps<T extends ElementType> = PolymorphicProps<T> & {
  interactive?: boolean;
};

export function FinformCard<T extends ElementType = 'section'>({
  as,
  className = '',
  interactive = false,
  children,
  ...props
}: FinformCardProps<T>) {
  const Component = as || 'section';

  return (
    <Component
      className={joinClasses(
        'gsm-card',
        interactive && 'gsm-card--interactive',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

type FinformButtonProps = ComponentPropsWithoutRef<'button'> & {
  tone?: 'primary' | 'secondary' | 'danger';
};

export function FinformButton({
  tone = 'primary',
  className = '',
  type = 'button',
  children,
  ...props
}: FinformButtonProps) {
  return (
    <button
      type={type}
      className={joinClasses('gsm-btn', `gsm-btn--${tone}`, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function FinformControl<T extends ElementType = 'input'>({
  as,
  className = '',
  children,
  ...props
}: PolymorphicProps<T>) {
  const Component = as || 'input';

  return (
    <Component className={joinClasses('gsm-control', className)} {...props}>
      {children}
    </Component>
  );
}
