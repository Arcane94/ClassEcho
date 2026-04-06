import type { ReactNode } from "react";
import { ArrowLeft, Home } from "lucide-react";

interface ObservationPanelLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  backIcon?: "arrow" | "home";
  backPlacement?: "inline" | "top-left";
  singleLineHeading?: boolean;
  width?: "default" | "wide";
  bodyClassName?: string;
  footer?: ReactNode;
}

export default function ObservationPanelLayout({
  title,
  subtitle,
  children,
  onBack,
  backIcon = "arrow",
  backPlacement = "top-left",
  singleLineHeading = true,
  width = "default",
  bodyClassName = "",
  footer,
}: ObservationPanelLayoutProps) {
  const shellClassName = width === "wide" ? "observation-shell observation-shell--wide" : "observation-shell";
  const panelClassName =
    width === "wide" ? "login-panel observation-panel observation-panel--wide" : "login-panel observation-panel";
  const contentClassName = bodyClassName ? `observation-panel-body ${bodyClassName}` : "observation-panel-body";
  const BackIcon = backIcon === "home" ? Home : ArrowLeft;
  const backLabel = backIcon === "home" ? "Go home" : "Go back";
  const isInlineBack = onBack && backPlacement === "inline";
  const isInlineStartBack = onBack && backPlacement === "top-left" && singleLineHeading;
  const isTopLeftBack = onBack && backPlacement === "top-left" && !singleLineHeading;
  const headerClassName = [
    "observation-panel-header",
    isInlineBack ? "observation-panel-header--with-back" : "",
    isInlineStartBack ? "observation-panel-header--with-back-start" : "",
    singleLineHeading ? "observation-panel-header--single-line" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const headingGroupClassName = [
    "observation-panel-heading-group",
    singleLineHeading ? "observation-panel-heading-group--single-line" : "",
    isInlineStartBack ? "observation-panel-heading-group--start" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const titleClassName = ["observation-panel-title", singleLineHeading ? "observation-panel-title--single-line" : ""]
    .filter(Boolean)
    .join(" ");
  const subtitleClassName = [
    "observation-panel-subtitle",
    singleLineHeading ? "observation-panel-subtitle--single-line" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="login-page observation-page">
      <div className={shellClassName}>
        <section className={panelClassName}>
          {isTopLeftBack && (
            <div className="observation-back-row">
              <button type="button" className="observation-back-button" onClick={onBack} aria-label={backLabel}>
                <BackIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          <header className={headerClassName}>
            {(isInlineBack || isInlineStartBack) && (
              <button type="button" className="observation-back-button" onClick={onBack} aria-label={backLabel}>
                <BackIcon className="h-5 w-5" />
              </button>
            )}

            <div className={headingGroupClassName}>
              <h1 className={titleClassName}>{title}</h1>
              {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
            </div>

            {isInlineBack && <div className="observation-panel-header-spacer" aria-hidden="true" />}
          </header>

          <div className={contentClassName}>{children}</div>

          {footer && <footer className="observation-panel-footer">{footer}</footer>}
        </section>
      </div>
    </div>
  );
}
