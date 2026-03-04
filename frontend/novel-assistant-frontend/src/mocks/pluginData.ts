export const MOCK_PROJECT_SESSION_DATA = {
  name: "project_helper",
  info_type: "ProjectSessionManager",
  data: {
    pages: [
      {
        id: "page_home",
        name: "首页",
        sessions: [
          {
            id: "sess_1",
            title: "关于项目架构的讨论",
            create_time: "2023-10-27 10:00",
            message_count: 5,
            tokens: 1205,
            messages: [
              { role: "user", content: "这个项目的架构是怎么样的？" },
              { role: "assistant", content: "本项目采用了服务端驱动 UI (SDUI) 的架构..." }
            ]
          },
          {
            id: "sess_2", 
            title: "API 接口设计",
            create_time: "2023-10-26 15:30",
            message_count: 2,
            tokens: 450,
            messages: [
              { role: "user", content: "GET /plugins 接口需要返回什么？" },
              { role: "assistant", content: "需要返回插件列表，包含 id, name, config_schema 等字段。" }
            ]
          }
        ]
      },
      {
        id: "page_editor",
        name: "编辑器",
        sessions: []
      }
    ]
  }
};

export const MOCK_DOCUMENT_SESSION_DATA = {
  name: "document_helper",
  info_type: "DocumentSessionManager",
  data: {
    documents: [
      {
        id: "doc_1",
        title: "第一章：初入江湖",
        sessions: [
          {
            id: "sess_d1",
            title: "第一章大纲优化",
            create_time: "2023-10-28 09:00",
            message_count: 8,
            tokens: 2300,
            messages: [
              { role: "user", content: "帮我优化一下第一章的开头，主角出场不够帅。" },
              { role: "assistant", content: "建议可以从侧面描写切入，比如通过路人的反应..." }
            ]
          }
        ]
      },
      {
        id: "doc_2",
        title: "第二章：风云变幻",
        sessions: []
      }
    ]
  }
};
