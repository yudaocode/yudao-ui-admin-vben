import { formatFileSize } from '@vben/utils';

import {
  PmsKnowledgeDocumentStatus,
  PmsKnowledgeObjectType,
} from './constants';

/** 获得知识对象图标 */
export function getKnowledgeObjectIcon(type: number) {
  return (
    {
      [PmsKnowledgeObjectType.LIBRARY]: 'lucide:notebook',
      [PmsKnowledgeObjectType.FOLDER]: 'lucide:folder',
      [PmsKnowledgeObjectType.DOCUMENT]: 'lucide:file-text',
      [PmsKnowledgeObjectType.FILE]: 'lucide:paperclip',
    }[type] || 'lucide:circle-help'
  );
}

/** 知识库文档状态对应的标签类型 */
export function getKnowledgeDocumentStatusTagType(status: number) {
  return status === PmsKnowledgeDocumentStatus.NORMAL ? 'success' : 'info';
}

/** 格式化知识库文件大小 */
export function formatKnowledgeFileSize(size?: null | number) {
  if (size === undefined || size === null || size < 0) return '';
  return formatFileSize(size);
}
