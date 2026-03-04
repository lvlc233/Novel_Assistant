import React from 'react';
import { ComponentRegistry } from '@/components/registry';

interface SDUIRendererProps {
  ui_target: string | null;
  props?: Record<string, any>;
  children?: React.ReactNode;
}

/**
 * Server-Driven UI Renderer
 * Renders a component based on the ui_target string from the backend.
 * Looks up the component in the ComponentRegistry.
 */
export const SDUIRenderer: React.FC<SDUIRendererProps> = ({ ui_target, props, children }) => {
  if (!ui_target) {
    return null;
  }

  // Handle case sensitivity if needed, though ComponentRegistry has lowercase keys now
  const Component = ComponentRegistry[ui_target] || ComponentRegistry[ui_target.toLowerCase()];

  if (!Component) {
    console.warn(`SDUI Component not found for ui_target: ${ui_target}`);
    return (
        <div className="p-4 border border-dashed border-red-200 bg-red-50/50 text-red-500 rounded-md text-sm font-mono">
            SDUI Error: Component "{ui_target}" not found
        </div>
    );
  }

  return <Component {...props}>{children}</Component>;
};
