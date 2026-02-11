import React from 'react';
import { BookOpen, Tag, GitFork, Lock, Settings2 } from 'lucide-react';

/**
 * 开发者: FrontendAgent(react)
 * 创建时间: 2026-01-30 16:40
 * 说明: 作品类型管理插件的专用配置编辑器
 */

interface WorkTypeItem {
    id: string;
    work_type: string;
    node_tags: string[];
    relationship: Record<string, string>[];
    configurable: boolean;
}

// 兼容数组或对象包装
type WorkTypeConfig = WorkTypeItem[] | { types: WorkTypeItem[] } | any;

interface WorkTypeConfigEditorProps {
    config: WorkTypeConfig;
    onChange: (newConfig: WorkTypeConfig) => void;
}

const WorkTypeConfigEditor: React.FC<WorkTypeConfigEditorProps> = ({ config, onChange }) => {
    // Normalize data
    let items: WorkTypeItem[] = [];
    if (Array.isArray(config)) {
        items = config;
    } else if (config && Array.isArray(config.types)) {
        items = config.types;
    } else {
        // Fallback for unexpected structure, try to find first array
        const values = Object.values(config || {});
        const foundArray = values.find(v => Array.isArray(v));
        if (foundArray) items = foundArray as WorkTypeItem[];
    }

    // 暂时只支持展示，后续如果支持自定义类型，可以添加编辑功能
    // 由于目前系统类型 configurable: false，且无添加接口，主要做可视化展示

    if (items.length === 0) {
        return <div className="text-gray-400 text-sm text-center py-8">暂无作品类型配置</div>;
    }

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-xs flex items-start gap-2">
                <Settings2 className="w-4 h-4 shrink-0 mt-0.5" />
                <p>当前仅支持查看系统预设的作品类型结构。自定义类型功能开发中。</p>
            </div>

            {items.map((item, index) => (
                <div key={item.id || index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    {/* Background Icon */}
                    <div className="absolute -right-4 -bottom-4 text-gray-50 opacity-50 pointer-events-none">
                        <BookOpen size={100} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                {item.work_type}
                            </h3>
                            {!item.configurable && (
                                <span className="flex items-center gap-1 text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                    <Lock size={10} />
                                    System Locked
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Tags */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                                    <Tag size={12} />
                                    支持节点类型 (Node Tags)
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {item.node_tags?.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200 font-mono">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Relationship */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                                    <GitFork size={12} />
                                    层级关系 (Relationship Constraints)
                                </h4>
                                <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 border border-gray-100">
                                    {item.relationship?.map((rel, idx) => (
                                        <div key={idx} className="flex items-center gap-2 mb-1 last:mb-0">
                                            {Object.entries(rel).map(([parent, child]) => (
                                                <span key={`${parent}-${child}`}>
                                                    <span className="text-blue-600 font-bold">{parent}</span>
                                                    <span className="mx-2 text-gray-400">→</span>
                                                    <span className="text-green-600 font-bold">{child}</span>
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                    {(!item.relationship || item.relationship.length === 0) && (
                                        <span className="text-gray-400">无特定约束</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WorkTypeConfigEditor;
