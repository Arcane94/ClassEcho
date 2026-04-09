// Injects the visualization stylesheet when the visualization screens mount.
import { useEffect } from "react";
import visualizationStyles from "../styles/visualizationMode.css?raw";

export function useVisualizationStyles() {
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.setAttribute("data-visualization-mode-styles", "true");
    styleElement.textContent = visualizationStyles;
    document.head.appendChild(styleElement);

    return () => {
      styleElement.remove();
    };
  }, []);
}
