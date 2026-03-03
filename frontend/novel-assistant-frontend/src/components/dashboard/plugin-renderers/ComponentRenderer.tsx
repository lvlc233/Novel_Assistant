import React from 'react';
import { ComponentSchema } from '@/types/plugin';
import { Button } from '@/components/ui/button';
import { invokePluginOperation } from '@/services/pluginService';

interface ComponentRendererProps {
  schema: ComponentSchema;
  onRefresh?: () => void;
  defaultPluginId?: string;
}

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({ schema, onRefresh, defaultPluginId }) => {
  const { type, props, children } = schema;

  const handleAction = async (action: any) => {
    if (!action) return;
    try {
        if (action.type === 'invoke_operation' && action.operation) {
             // Priority: _provider_id > defaultPluginId > plugin_id/agent_id
             const pluginId = action.params?._provider_id || defaultPluginId || action.params?.plugin_id || action.params?.agent_id;
             if (pluginId) {
                 await invokePluginOperation(pluginId, action.operation, action.params);
                 onRefresh?.();
             } else {
                 console.error("Missing plugin_id in action params", action);
             }
        }
    } catch (e) {
        console.error("Action failed", e);
    }
  };

  const renderChildren = () => {
    return children?.map((child, index) => (
      <ComponentRenderer key={index} schema={child} onRefresh={onRefresh} defaultPluginId={defaultPluginId} />
    ));
  };

  const getGridColsClass = (cols: number) => {
      switch(cols) {
          case 1: return 'md:grid-cols-1';
          case 2: return 'md:grid-cols-2';
          case 3: return 'md:grid-cols-3';
          case 4: return 'md:grid-cols-4';
          default: return 'md:grid-cols-3';
      }
  };

  switch (type) {
    case 'Grid':
      const columns = props.columns || 3;
      const gap = props.gap || 4;
      
      return (
        <div className={`grid grid-cols-1 ${getGridColsClass(columns)} gap-${gap} w-full`}>
          {renderChildren()}
        </div>
      );
    case 'Card':
      return (
        <div className="bg-surface-primary border border-border-primary rounded-xl p-4 hover:shadow-lg transition-all duration-200 flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-text-primary text-lg">{props.title}</h3>
                {props.tags && props.tags.length > 0 && (
                     <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
                        {props.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-text-secondary text-sm mb-4 line-clamp-2 flex-grow">
                {props.summary}
            </p>
            {props.actions && (
                <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-border-secondary">
                     {props.actions.menu && Array.isArray(props.actions.menu) && props.actions.menu.map((action: any, idx: number) => (
                         <Button key={idx} variant="outline" size="sm" onClick={() => handleAction(action)}>
                             {action.label}
                         </Button>
                     ))}
                     {props.actions.click && (
                         <Button size="sm" onClick={() => handleAction(props.actions.click)}>
                             查看
                         </Button>
                     )}
                </div>
            )}
        </div>
      );
    case 'Button':
        return (
            <Button 
                variant={props.variant || 'default'} 
                size={props.size || 'default'}
                onClick={() => handleAction(props.action)}
            >
                {props.label}
            </Button>
        );
    case 'Text':
        return <p className={`text-text-primary ${props.className || ''}`}>{props.content}</p>;
    default:
      return (
        <div className="border border-red-500 p-2 text-red-500">
            Unknown Component: {type}
            {renderChildren()}
        </div>
      );
  }
};
