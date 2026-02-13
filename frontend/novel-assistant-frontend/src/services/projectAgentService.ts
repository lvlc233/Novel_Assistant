import { request } from '@/lib/request';

// Feature flag for using mock data
const USE_MOCK = false;

export interface ProjectConfig {
    model_name: string;
    base_url: string;
    api_key: string;
    user_prompt: string;
}

export interface ResourceStatus {
    resource_name: string[];
    enabled: boolean;
}

export interface HistoryItem {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

// Mock Data
const mockConfig: ProjectConfig = {
    model_name: 'gpt-4',
    base_url: 'https://api.openai.com/v1',
    api_key: 'sk-mock-key',
    user_prompt: 'You are a helpful project assistant.'
};

const mockResources: string[] = ['dashboard', 'novel_create']; // Enabled resources

const mockHistory: Record<string, HistoryItem[]> = {
    'dashboard': [
        { id: '1', role: 'user', content: '怎么使用工作台？', timestamp: '2024-02-13 10:00:00' },
        { id: '2', role: 'assistant', content: '工作台是您的项目概览中心...', timestamp: '2024-02-13 10:00:05' }
    ]
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const projectAgentService = {
    /**
     * 获取项目助手配置
     * 注释者: FrontendAgent(react)
     * 时间: 2026-02-13 15:30:00
     * 说明: 获取全局的项目助手配置 (LLM设置等)
     */
    getConfig: async (): Promise<ProjectConfig> => {
        if (USE_MOCK) {
            await delay(500);
            return { ...mockConfig };
        }
        try {
            return await request.get<ProjectConfig>('/plugin/agent/project_helper/config');
        } catch (error) {
            console.error('Failed to get project config', error);
            // Fallback to mock/empty on error during dev
            return { ...mockConfig };
        }
    },

    /**
     * 更新项目助手配置
     */
    updateConfig: async (config: ProjectConfig): Promise<void> => {
        if (USE_MOCK) {
            await delay(500);
            Object.assign(mockConfig, config);
            return;
        }
        await request.post('/plugin/agent/project_helper/config', config);
    },

    /**
     * 获取已启用的资源列表
     */
    getEnabledResources: async (): Promise<string[]> => {
        if (USE_MOCK) {
            await delay(500);
            return [...mockResources];
        }
        try {
            // The backend returns List[ProjectHelperResourcesResponse]
            // where each item has { resource_name: string[], enabled: boolean }
            const response = await request.get<ResourceStatus[]>('/plugin/agent/project_helper/resources');
            
            // Flatten the list of enabled resources
            const enabledResources: string[] = [];
            response.forEach(item => {
                if (item.enabled) {
                    enabledResources.push(...item.resource_name);
                }
            });
            return enabledResources;
        } catch (error) {
            console.error('Failed to get enabled resources', error);
            return [];
        }
    },

    /**
     * 切换资源启用状态
     * 由于后端接口是 update_resources(resource_name: list[str], enabled: bool)
     * 我们每次只切换一个资源的 enabled 状态
     */
    toggleResource: async (resourceId: string, enabled: boolean): Promise<void> => {
        if (USE_MOCK) {
            await delay(300);
            if (enabled) {
                if (!mockResources.includes(resourceId)) mockResources.push(resourceId);
            } else {
                const index = mockResources.indexOf(resourceId);
                if (index > -1) mockResources.splice(index, 1);
            }
            return;
        }
        
        await request.post('/plugin/agent/project_helper/resources', {
            resource_name: [resourceId],
            enabled: enabled
        });
    },

    /**
     * 获取历史记录
     * 目前后端暂未提供专门的历史记录接口，暂时返回Mock数据
     */
    getHistory: async (resourceId: string): Promise<HistoryItem[]> => {
        if (USE_MOCK) {
            await delay(300);
            return mockHistory[resourceId] || [];
        }
        
        // TODO: Implement actual history fetch when backend is ready
        // For now, return mock data even in "real" mode because backend 404s or doesn't exist
        return mockHistory[resourceId] || [];
    }
};
