<script lang="ts" setup>
import type { PmsKnowledgeDocumentApi } from '#/api/pms/kb/content/document';
import type { PmsKnowledgeDocumentLabelApi } from '#/api/pms/kb/content/document/label';

import { computed } from 'vue';

import { confirm } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import {
  ElAvatar,
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElLink,
  ElMessage,
  ElTag,
} from 'element-plus';

import { deleteKnowledgeDocument } from '#/api/pms/kb/content/document';
import { FilePreview } from '#/components/file-preview';
import {
  PmsKnowledgeContentLevel,
  PmsKnowledgeDocumentType,
} from '#/views/pms/kb/utils/constants';
import {
  formatKnowledgeFileSize,
  getKnowledgeDocumentStatusTagType,
} from '#/views/pms/kb/utils/format';
import {
  canDeleteKnowledgeContent,
  canEditKnowledgeContent,
} from '#/views/pms/kb/utils/permission';

import KnowledgeDocumentComment from './knowledge-document-comment.vue';

defineOptions({ name: 'PmsKnowledgeDocumentDetail' });

// TODO @AI：详情可以保留自定义；三端模板差一截，对齐操作区和附件展示。

const props = defineProps<{
  document: PmsKnowledgeDocumentApi.KnowledgeDocument;
  labels: PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel[];
}>(); // 组件参数

const emit = defineEmits([
  'collect',
  'like',
  'permission',
  'share',
  'update',
  'move',
  'delete',
]); // 组件事件

const canManage = computed(
  () => props.document.currentUserLevel === PmsKnowledgeContentLevel.MANAGE,
); // 是否可管理文档协作权限
const loginUserId = computed(() => useUserStore().userInfo?.id); // 当前登录用户编号
const likeSummary = computed(() => {
  // 优先表达“您”和其他点赞人数
  const likeUsers = props.document.likeUsers.filter((user) => user.nickname);
  if (props.document.likeStatus) {
    const otherCount = likeUsers.filter(
      (user) => user.id !== loginUserId.value,
    ).length;
    return otherCount > 0 ? `您和其他 ${otherCount} 人` : '您赞了该文档';
  }
  return likeUsers.length > 0 ? `${likeUsers.length} 人赞了该文档` : '';
}); // 点赞摘要文案

/** 处理更多操作 */
async function handleMoreCommand(command: string) {
  if (command === 'delete') {
    await handleDelete();
    return;
  }
  if (command === 'move') {
    emit('move');
  }
}

/** 删除文档 */
async function handleDelete() {
  try {
    // 删除的二次确认
    await confirm(`确认删除文档“${props.document.title}”及其子文档吗？`);
    // 发起删除
    await deleteKnowledgeDocument(props.document.id);
    ElMessage.success('删除成功');
    // 通知父组件刷新目录树
    emit('delete');
  } catch {
  }
}
</script>

<template>
  <!-- 文档信息与快捷操作 -->
  <div
    class="mb-4 flex items-start justify-between gap-6 border-0 border-b border-solid border-[var(--el-border-color-lighter)] pb-3 pt-2 max-[1100px]:flex-col"
  >
    <div class="min-w-0">
      <div class="truncate text-xl font-semibold leading-[1.4]">
        {{ document.title }}
      </div>
      <div
        class="mt-2 flex items-center gap-2.5 text-xs text-[var(--el-text-color-secondary)]"
      >
        <span v-if="document.creatorUserName">{{ document.creatorUserName }} 创建于</span>
        <span>{{ formatDateTime(document.createTime) }}</span>
        <ElTag
          size="small"
          :type="getKnowledgeDocumentStatusTagType(document.status)"
        >
          {{ getDictLabel(DICT_TYPE.PMS_KNOWLEDGE_DOCUMENT_STATUS, document.status) || '-' }}
        </ElTag>
      </div>
      <div
        v-if="labels.length"
        class="mt-2.5 flex flex-wrap items-center gap-2"
      >
        <span
          v-for="label in labels"
          :key="label.id"
          :style="{
            color: label.color,
            borderColor: label.color,
            backgroundColor: `${label.color}14`,
          }"
          class="rounded border border-solid px-1.5 py-px text-xs leading-[18px]"
        >
          {{ label.name }}
        </span>
      </div>
    </div>
    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <ElButton
        v-if="canEditKnowledgeContent(document.currentUserLevel)"
        v-access:code="['pms:kb:library:update']"
        class="!ml-0"
        size="small"
        @click="emit('update')"
      >
        <IconifyIcon icon="ep:edit" />编辑
      </ElButton>
      <ElButton
        v-if="canManage"
        v-access:code="['pms:kb:library:update']"
        class="!ml-0"
        size="small"
        @click="emit('permission')"
      >
        <IconifyIcon icon="ep:user" />协作
      </ElButton>
      <ElButton class="!ml-0" size="small" @click="emit('collect')">
        <IconifyIcon
          :icon="document.favoriteStatus ? 'ep:star-filled' : 'ep:star'"
        />
        {{ document.favoriteStatus ? '已关注' : '关注' }}
      </ElButton>
      <ElButton
        v-if="canEditKnowledgeContent(document.currentUserLevel)"
        v-access:code="['pms:kb:library:update']"
        class="!ml-0"
        size="small"
        type="primary"
        @click="emit('share')"
      >
        <IconifyIcon icon="ep:share" />分享
      </ElButton>
      <ElDropdown
        v-if="canEditKnowledgeContent(document.currentUserLevel)"
        @command="handleMoreCommand"
      >
        <ElButton class="!ml-0" size="small">
          <IconifyIcon icon="ep:more-filled" />
        </ElButton>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem
              v-if="canManage"
              v-access:code="['pms:kb:library:update']"
              command="move"
            >
              移动
            </ElDropdownItem>
            <ElDropdownItem
              v-if="canDeleteKnowledgeContent(document.currentUserLevel)"
              v-access:code="['pms:kb:library:delete']"
              command="delete"
              divided
            >
              删除
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>
  </div>

  <!-- 文档正文或文件预览 -->
  <div
    v-if="document.type === PmsKnowledgeDocumentType.RICH_TEXT"
    v-dompurify-html="document.content || '<p>暂无内容</p>'"
    class="pms-knowledge-rich-text"
  ></div>
  <div v-else>
    <template v-if="document.content">
      <div class="mb-3 flex items-center justify-end gap-2">
        <ElTag type="info">{{ document.fileType || '文件' }}</ElTag>
        <span
          v-if="document.fileSize !== undefined"
          class="text-xs text-[var(--el-text-color-secondary)]"
        >
          {{ formatKnowledgeFileSize(document.fileSize) }}
        </span>
        <ElLink
          v-if="document.downloadStatus"
          :href="document.content"
          target="_blank"
          type="primary"
        >
          下载文件
        </ElLink>
        <span v-else class="text-xs text-[var(--el-text-color-secondary)]">
          当前角色仅可在线预览
        </span>
      </div>
      <FilePreview
        :downloadable="document.downloadStatus"
        :file-name="document.title"
        :file-type="document.fileType"
        :url="document.previewUrl || document.content"
      />
    </template>
    <ElEmpty v-else description="文件未上传" />
  </div>

  <!-- 仅富文本支持点赞和评论；文件类型不支持互动 -->
  <div
    v-if="document.type === PmsKnowledgeDocumentType.RICH_TEXT"
    class="mt-3 flex items-center gap-2.5 text-xs text-[var(--el-text-color-secondary)]"
  >
    <ElButton
      link
      :type="document.likeStatus ? 'primary' : 'info'"
      @click="emit('like')"
    >
      <IconifyIcon
        :icon="
          document.likeStatus
            ? 'ant-design:like-filled'
            : 'ant-design:like-outlined'
        "
      />
      {{ document.likeStatus ? '取消点赞' : '点赞' }}
    </ElButton>
    <span v-if="likeSummary">{{ likeSummary }}</span>
    <ElAvatar
      v-for="user in document.likeUsers.slice(0, 5)"
      :key="user.id"
      :size="22"
      :src="user.avatar"
    >
      {{ user.nickname?.slice(0, 1) }}
    </ElAvatar>
  </div>

  <!-- 文档评论 -->
  <KnowledgeDocumentComment
    v-if="document.type === PmsKnowledgeDocumentType.RICH_TEXT"
    :document-id="document.id"
  />
</template>

<!-- 富文本由 v-html 动态插入，使用唯一的全局命名空间保证子节点样式稳定生效 -->
<style lang="scss">
.pms-knowledge-rich-text {
  display: flow-root;
  padding: 0 0 4px;
  font-size: 14px;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;

  h1 {
    margin: 20px 0 14px;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.4;
  }

  h2 {
    margin: 18px 0 10px;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.4;
  }

  h3 {
    margin: 14px 0 8px;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
  }

  p {
    margin: 0 0 12px;
    line-height: 1.75;
  }

  > :first-child {
    margin-top: 0;
  }

  img {
    max-width: 100%;
    height: auto;
  }
}
</style>
