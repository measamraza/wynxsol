import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useNavigation } from "../../context/NavigationContext";

export interface SmartLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  curtainLabel?: string;
}

export function SmartLink({ to, curtainLabel, onClick, target, children, ...rest }: SmartLinkProps) {
  const { navigateWithCurtain } = useNavigation();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (
      target === "_blank" ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0 ||
      to.startsWith("http") ||
      to.startsWith("mailto:")
    ) {
      return;
    }

    event.preventDefault();
    navigateWithCurtain(to, curtainLabel);
  };

  return (
    <a href={to} target={target} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
