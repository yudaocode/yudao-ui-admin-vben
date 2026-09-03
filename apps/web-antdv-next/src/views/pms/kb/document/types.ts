import { PmsKnowledgeDocumentType } from '#/views/pms/kb/utils/constants';

/** 知识库目录树节点 */
export interface KnowledgeTreeNode {
  children: KnowledgeTreeNode[];
  currentUserLevel?: number;
  entityId: number;
  key: string;
  kind: 'document' | 'folder';
  label: string;
  type?: number;
}

/** 知识库详情当前内容 */
export type KnowledgeContentView = 'document' | 'folder' | 'home' | 'recycle';

/** 获得目录节点图标 */
export function getKnowledgeTreeNodeIcon(node: KnowledgeTreeNode) {
  if (node.kind === 'folder') return 'lucide:folder';
  return node.type === PmsKnowledgeDocumentType.FILE
    ? 'lucide:paperclip'
    : 'lucide:file-text';
}

/** 获得目录节点类型名称 */
export function getKnowledgeTreeNodeTypeName(node: KnowledgeTreeNode) {
  if (node.kind === 'folder') return '文件夹';
  return node.type === PmsKnowledgeDocumentType.FILE ? '文件' : '文档';
}
