import React from 'react';
import { SlotRenderer } from '@/contexts/SlotContext';

// Container component for the PluginExpand slot
export const PluginExpand: React.FC = () => {
    // Corresponds to backend Home.PluginExpand
    return (
        <div className="w-full animate-fade-in">
            <SlotRenderer slotId="/home/pluginexpand" />
        </div>
    );
};
