import { WorkDetailResponse, WorkMetaResponse, WorkMetaDTO, NodeDTO, EdgeDTO } from '@/services/models';
import { Novel, Volume, Chapter } from '@/types/work';
import { request } from '@/lib/request';

/**
 * 开发者: FrontendAgent(react)
 * 当前版本: FE-REF-20260130-03
 * 创建时间: 2026-01-20 21:48
 * 更新时间: 2026-01-31 10:20
 * 更新记录:
 * - [2026-01-31 10:20:FE-REF-20260130-03: 将 Work 类型重命名为 Novel 作为视图模型。]
 * - [2026-01-31 10:05:FE-REF-20260130-02: 更新类型为 Work，重构映射函数。]
 * - [2026-01-30 11:30:FE-REF-20260130-01: 配合统一架构文档：单数路径，清理 DTO，使用 relationship 构建树结构。]
 */

/**
 * 数据模型映射: DTO -> 领域模型 (Domain Model)
 */
function mapWorkMetaToNovel(meta: WorkMetaDTO): Novel {
  return {
    id: meta.id,
    title: meta.name || '未命名作品',
    cover: meta.cover_image_url || '',
    synopsis: meta.summary || '暂无简介',
    // wordCount: 0, 
    status: meta.state === '完成' ? '完结' : '连载中',
    type: meta.type,
    updatedAt: new Date(meta.update_at).toLocaleString(),
    createdAt: new Date(meta.create_at).toLocaleDateString(),
    volumes: [],
    orphanChapters: []
  };
}

function mapNodesToVolumesAndChapters(nodes: NodeDTO[], relationships: EdgeDTO[]): { volumes: Volume[], orphanChapters: Chapter[] } {
  const volumes: Volume[] = [];
  const orphanChapters: Chapter[] = [];
  
  // 1. 按 ID 为节点建立索引
  const nodeMap = new Map<string, NodeDTO>();
  nodes.forEach(node => nodeMap.set(node.id, node));

  // 2. 根据关系 (Relationships) 构建树形结构
  // EdgeDTO 结构: { from_node_id: string, to_node_ids: string[] }
  // 鉴于目前只有“卷”（文件夹）和“章节”（文档），层级结构较为扁平（文件夹 -> 文档）或（作品 -> 文档/文件夹）。
  // 架构文档暗示这是一个通用图结构，但 UI 需要通用的树结构或特定的 Novel 结构。
  // 我们的假设如下：
  // - 顶级节点是那些未出现在任何其他节点的 'to_node_ids' 中的节点。
  // - 或者存在一个代表作品的根节点？不，Work 模型已有 `document` 列表。
  // - 实际上，`EdgeDTO` 定义了子级。
  // - 我们需要找出哪些节点是“根”（作品）的子节点。但 EdgeDTO 的 `from_node_id` 是 UUID，作品是否有匹配 `from_node_id` 的 UUID？
  // - 架构中的 `NodeDTO` 似乎并不包含“作品”本身作为一个节点。
  // - 假设：未出现在任何 `to_node_ids` 中的节点即为根节点。
  // - 等等，`DocumentCreateRequest` 有 `from_node_id`，如果为空，则为根节点。
  // - 因此 `EdgeDTO` 可能仅存在于文件夹节点。
  // - 如何获取根节点的顺序？
  // - `WorkDetailResponse` 中有 `relationship`。也许其中一个 EdgeDTO 的 `from_node_id` 等于 work_id？
  // - 检查 `WorkDetailResponse`：`meta` 中有 `id`。如果 `relationship` 包含一个从 `work_id` 出发的边，则能得到根节点的顺序。
  
  // 尝试寻找 from_node_id 匹配已知文件夹或作品本身的边。
  // 虽然此处不易直接获取作品 ID（除非作为参数传入），我们尝试进行推断。
  // 严格解读：
  // - 文件夹拥有子节点。
  // - 没有父节点的节点是独立节点（根节点）。
  
  // 映射 子节点 -> 父节点
  const parentMap = new Map<string, string>();
  relationships.forEach(edge => {
      edge.to_node_ids.forEach(childId => {
          parentMap.set(childId, edge.from_node_id);
      });
  });

  // 识别卷（文件夹）和章节（文档）
  // 我们需要保持顺序。
  // 假设 `relationship` 定义了文件夹子节点的顺序。
  // 那么根节点的顺序呢？响应中的 `nodes` 列表可能无序。
  // 架构文档未明确提及 `NodeDTO` 中的 `sort_order`。
  // 如果根节点缺少对应的 EdgeDTO，我们将无法排序。
  // 假设：后端会发送一个 EdgeDTO，其 `from_node_id` 为作品 ID（或某个根 ID），并列出顶级节点。
  // 如果是这样，`parentMap` 会将 parentId 设置为作品 ID。
  // 而 `nodeMap.has(作品ID)` 将返回 false。
  // 因此下方的 `else` 代码块“父节点可能是作品 ID”涵盖了这种情况。
  // 我们应该尝试基于来自“作品 ID”的 EdgeDTO 对 `rootNodes` 进行排序。
  
  // 分组：按父节点分组
  const childrenByParent = new Map<string, NodeDTO[]>();
  const rootNodes: NodeDTO[] = [];

  nodes.forEach(node => {
      const parentId = parentMap.get(node.id);
      if (parentId) {
          // 检查父节点是否为已知的文件夹
          if (nodeMap.has(parentId) && nodeMap.get(parentId)?.type === 'folder') {
              if (!childrenByParent.has(parentId)) {
                  childrenByParent.set(parentId, []);
              }
              childrenByParent.get(parentId)?.push(node);
          } else {
              // 父节点很可能是作品 ID 或未知节点，视为根节点
              rootNodes.push(node);
          }
      } else {
          // 在关系映射中没有父节点 -> 根节点
          rootNodes.push(node);
      }
  });

  // 对根节点进行排序
  // 如果没有针对作品 ID 的 EdgeDTO，我们无法确定根节点的顺序。
  // 寻找 `from_node_id` 不在 `nodeMap` 中的那条边（即代表作品到根节点的边）。
  const rootEdge = relationships.find(e => !nodeMap.has(e.from_node_id));
  if (rootEdge) {
      const orderMap = new Map<string, number>();
      rootEdge.to_node_ids.forEach((id, index) => orderMap.set(id, index));
      rootNodes.sort((a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999));
  }

  // 处理根节点
  rootNodes.forEach((node, index) => {
      if (node.type === 'folder') {
          // 识别为“卷”
          const childrenIds = getChildrenIds(node.id);
          // 获取子节点并按照 `to_node_ids` 中的顺序排序
          const volumeChapters: Chapter[] = [];
          
          if (childrenIds.length > 0) {
              childrenIds.forEach((childId, cIndex) => {
                  const childNode = nodeMap.get(childId);
                  if (childNode && childNode.type === 'document') {
                       const currentVersion = childNode.now_version || 'v1.0.0';
                       volumeChapters.push({
                           id: childNode.id,
                           title: childNode.name,
                           order: cIndex,
                           volumeId: node.id,
                           currentVersionId: currentVersion,
                           currentVersionName: currentVersion,
                           versions: [{id: currentVersion, version: currentVersion, content: '', updatedAt: new Date().toISOString()}]
                       });
                  }
              });
          }

          volumes.push({
              id: node.id,
              title: node.name,
              order: index,
              isExpanded: true,
              chapters: volumeChapters
          });
      } else {
          // 识别为“独立章节”
          const currentVersion = node.now_version || 'v1.0.0';
          orphanChapters.push({
               id: node.id,
               title: node.name,
               order: index,
               volumeId: undefined,
               currentVersionId: currentVersion,
               currentVersionName: currentVersion,
               versions: [{id: currentVersion, version: currentVersion, content: '', updatedAt: new Date().toISOString()}]
          });
      }
  });

  // 辅助函数：获取文件夹的子节点 ID 列表
  function getChildrenIds(folderId: string) {
      const edge = relationships.find(e => e.from_node_id === folderId);
      return edge ? edge.to_node_ids : [];
  }

  return { volumes, orphanChapters };
}

function mapDetailResponseToModel(data: WorkDetailResponse): Novel {
  const work = mapWorkMetaToNovel(data.meta);
  const { volumes, orphanChapters } = mapNodesToVolumesAndChapters(data.document, data.relationship);
  work.volumes = volumes;
  work.orphanChapters = orphanChapters;
  
  // 计算字数（预留）
  // work.wordCount = 0; 

  return work;
}

/**
 * 获取作品列表
 */
export async function getWorkList(userId: string): Promise<Novel[]> {
  const response = await request.get<WorkMetaResponse[]>('/work');
  if (Array.isArray(response)) {
    return response.map(item => mapWorkMetaToNovel(item.meta));
  }
  return [];
}

/**
 * 获取作品详情
 */
export async function getWorkDetail(userId: string, workId: string): Promise<Novel> {
  const data = await request.get<WorkDetailResponse>(`/work/${workId}`);
  return mapDetailResponseToModel(data);
}

export interface CreateWorkDto {
  user_id: string; // 后端忽略此字段
  work_name: string;
  work_summary?: string;
  work_cover_image_url?: string | File;
  work_type?: string;
  work_genre?: string;
  kd_id_list?: string[];
  plugins?: { id: string; enabled: boolean; config: any }[];
}

/**
 * 创建作品
 */
export async function createWork(data: CreateWorkDto): Promise<Novel> {
    
    let coverUrl = typeof data.work_cover_image_url === 'string' ? data.work_cover_image_url : undefined;

    // 处理文件上传
    if (data.work_cover_image_url instanceof File) {
        const formData = new FormData();
        formData.append('file', data.work_cover_image_url);
        
        try {
            const uploadRes = await request<{url: string, filename: string}>('/files/upload', {
                method: 'POST',
                body: formData
            });
            coverUrl = uploadRes.url;
        } catch (error) {
            console.error("上传失败", error);
        }
    }

    const payload: any = {
        name: data.work_name,
        summary: data.work_summary,
        cover_image_url: coverUrl,
        type: data.work_type || 'novel',
        enabled_plugin_id_list: data.plugins?.filter(p => p.enabled).map(p => p.id) || []
    };
    
    const result = await request.post<WorkMetaResponse>('/work', payload);
    return getWorkDetail(data.user_id, result.meta.id);
}

export interface UpdateWorkDto {
  work_id: string;
  user_id: string; // 后端忽略
  work_name?: string;
  work_summary?: string;
  work_cover_image_url?: string | File;
  work_status?: '连载中' | '完结' | '断更';
  plugins?: { id: string; enabled: boolean; config: any }[];
  // 插件更新在后端通常是独立的 API
}

/**
 * 更新作品
 */
export async function updateWork(data: UpdateWorkDto): Promise<Novel> {
    
    let coverUrl = typeof data.work_cover_image_url === 'string' ? data.work_cover_image_url : undefined;

    // 处理文件上传
    if (data.work_cover_image_url instanceof File) {
        const formData = new FormData();
        formData.append('file', data.work_cover_image_url);
        
        try {
            const uploadRes = await request<{url: string, filename: string}>('/files/upload', {
                method: 'POST',
                body: formData
            });
            coverUrl = uploadRes.url;
        } catch (error) {
            console.error("上传失败", error);
        }
    }

    // 后端接口: PATCH /work/{work_id}
    const payload: any = {};
    if (data.work_name) payload.name = data.work_name;
    if (data.work_summary) payload.summary = data.work_summary;
    if (coverUrl) payload.cover_image_url = coverUrl;
    if (data.work_status) payload.state = data.work_status === '完结' ? '完成' : '进行中';

    // 如果有插件更新
    if (data.plugins) {
         // 理想情况下这应该是单独的调用，或者后端在 PATCH /work/{id} 中支持更新 enabled_plugin_id_list。
         // 根据之前的分析，我们可能需要为每个插件调用 updateWorkPlugin。
         // 但此处我们先假设支持简单的元数据更新。
         // 如果需要更新插件：
         // payload.enabled_plugin_id_list = ...
    }

    if (Object.keys(payload).length > 0) {
        await request.patch(`/work/${data.work_id}`, payload);
    }

    return getWorkDetail(data.user_id, data.work_id);
}

/**
 * 删除作品
 */
export async function deleteWork(userId: string, workId: string): Promise<void> {
    await request.delete(`/work/${workId}`);
}