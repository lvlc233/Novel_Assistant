import React, { useEffect, useState } from 'react';
import { Card, Switch, List, Spin, message } from 'antd';
import { invokePlugin } from '@/services/pluginService'; // 正确的插件调用封装函数

/**
 * AgentToolManager
 *
 * 左侧展示所有 Agent（名称列表），点击后右侧显示该 Agent 可用的工具插件。
 * 每个插件以卡片形式呈现，卡片内部列出插件的所有 operation，
 * 并通过 Switch 控件展示 `operation_name_is_tool` 开关状态。
 * 切换开关后调用后端 `update_agent_tool_state` 接口持久化。
 */
const AgentToolManager: React.FC = () => {
  const [agents, setAgents] = useState<Array<{ agent_name: string; description?: string }>>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [plugins, setPlugins] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 加载所有 Agent 与其工具映射
  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await invokePlugin('agent_manager', 'get_agent_tool_info', new Map())
      setAgents(data);
      if (data.length > 0) setSelectedAgent(data[0].agent_name);
    } catch (err) {
      console.error(err);
      message.error('加载 Agent 列表失败');
    }
    setLoading(false);
  };

  // 加载选中 Agent 的插件与 operation 状态
  const loadPlugins = async (agentName: string) => {
    setLoading(true);
    try {
      const data = await invokePlugin('agent_manager', 'list_agent_plugins', new Map([['agent_name', agentName]]));
      setPlugins(data);
    } catch (err) {
      console.error(err);
      message.error('加载插件列表失败');
    }
    setLoading(false);
  };

  // 切换单个工具开关
  const toggleTool = async (pluginName: string, toolName: string, checked: boolean) => {
    try {
await invokePlugin('agent_manager', 'update_agent_tool_state', new Map([
          ['agent_name', selectedAgent],
          ['plugin_name', pluginName],
          ['tool_name', toolName],
          ['enabled', checked],
        ]));
      // 更新本地状态
      setPlugins((prev) =>
        prev.map((p) => {
          if (p.plugin_name !== pluginName) return p;
          return {
            ...p,
            operations: p.operations.map((op: any) =>
              op.name === toolName ? { ...op, enabled: checked } : op,
            ),
          };
        }),
      );
      message.success('更新成功');
    } catch (err) {
      console.error(err);
      message.error('更新失败');
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) loadPlugins(selectedAgent);
  }, [selectedAgent]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 左侧 Agent 列表 */}
      <div style={{ width: 200, borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
        <List
          dataSource={agents}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer', background: item.agent_name === selectedAgent ? '#e6f7ff' : undefined }}
              onClick={() => setSelectedAgent(item.agent_name)}
            >
              {item.agent_name}
            </List.Item>
          )}
        />
      </div>
      {/* 右侧插件卡片 */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {loading ? (
          <Spin />
        ) : (
          plugins.map((pl) => (
            <Card key={pl.plugin_name} title={pl.plugin_name} style={{ marginBottom: 16 }}>
              {pl.operations.map((op: any) => (
                <div key={op.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span>{op.name} – {op.description}</span>
                  <Switch checked={op.enabled} onChange={(checked) => toggleTool(pl.plugin_name, op.name, checked)} />
                </div>
              ))}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentToolManager;
