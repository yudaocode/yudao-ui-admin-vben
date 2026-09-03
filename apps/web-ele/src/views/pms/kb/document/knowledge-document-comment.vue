<script lang="ts" setup>
import type { PmsKnowledgeDocumentCommentApi } from '#/api/pms/kb/interaction/comment';

import { computed, ref, watch } from 'vue';

import { confirm } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import {
  ElAvatar,
  ElButton,
  ElDivider,
  ElEmpty,
  ElInput,
  ElMessage,
} from 'element-plus';

import {
  createKnowledgeDocumentComment,
  deleteKnowledgeDocumentComment,
  getKnowledgeDocumentCommentList,
} from '#/api/pms/kb/interaction/comment';

defineOptions({ name: 'PmsKnowledgeDocumentComment' });

const props = defineProps<{ documentId: number }>();

const loginUserId = computed(() => useUserStore().userInfo?.id); // 当前登录用户编号
const loading = ref(false); // 评论加载中
const submitting = ref(false); // 评论提交中
const comments = ref<PmsKnowledgeDocumentCommentApi.KnowledgeDocumentComment[]>(
  [],
); // 评论列表
const newContent = ref(''); // 新评论内容
const replyMainId = ref<number>(); // 当前回复的主评论编号
const replyUserId = ref<number>(); // 当前回复对象用户编号
const replyUserName = ref(''); // 当前回复对象姓名
const replyContent = ref(''); // 回复内容
const commentCount = computed(() =>
  comments.value.reduce(
    (count, comment) => count + 1 + (comment.children?.length || 0),
    0,
  ),
); // 评论总数（包含回复）

/** 查询列表 */
async function getList() {
  loading.value = true;
  try {
    comments.value = await getKnowledgeDocumentCommentList(props.documentId);
  } finally {
    loading.value = false;
  }
}

/** 发表评论 */
async function submitRootComment() {
  // 1. 校验评论内容
  if (!newContent.value.trim()) {
    ElMessage.warning('请输入评论内容');
    return;
  }
  submitting.value = true;
  try {
    // 2. 提交评论
    await createKnowledgeDocumentComment({
      documentId: props.documentId,
      content: newContent.value,
    } as unknown as PmsKnowledgeDocumentCommentApi.KnowledgeDocumentComment);
    ElMessage.success('评论成功');
    // 3. 清空输入并刷新评论列表
    newContent.value = '';
    await getList();
  } finally {
    submitting.value = false;
  }
}

/** 开始回复评论 */
function startReply(
  mainComment: PmsKnowledgeDocumentCommentApi.KnowledgeDocumentComment,
  targetComment: PmsKnowledgeDocumentCommentApi.KnowledgeDocumentComment,
) {
  replyMainId.value = mainComment.id;
  replyUserId.value = targetComment.userId;
  replyUserName.value = targetComment.userName || '';
  replyContent.value = '';
}

/** 取消回复评论 */
function cancelReply() {
  replyMainId.value = undefined;
  replyUserId.value = undefined;
  replyUserName.value = '';
  replyContent.value = '';
}

/** 提交评论回复 */
async function submitReply() {
  // 1. 校验回复内容和主评论
  if (!replyContent.value.trim() || !replyMainId.value) {
    ElMessage.warning('请输入回复内容');
    return;
  }
  submitting.value = true;
  try {
    // 2. 提交评论回复
    await createKnowledgeDocumentComment({
      documentId: props.documentId,
      mainId: replyMainId.value,
      replyUserId: replyUserId.value,
      content: replyContent.value,
    } as unknown as PmsKnowledgeDocumentCommentApi.KnowledgeDocumentComment);
    ElMessage.success('回复成功');
    // 3. 重置回复状态并刷新列表
    cancelReply();
    await getList();
  } finally {
    submitting.value = false;
  }
}

/** 删除评论 */
async function handleDelete(
  comment: PmsKnowledgeDocumentCommentApi.KnowledgeDocumentComment,
) {
  try {
    // 删除的二次确认
    await confirm('确认删除这条评论吗？');
    // 发起删除
    await deleteKnowledgeDocumentComment(comment.id);
    ElMessage.success('删除成功');
    await getList();
  } catch {
  }
}

watch(
  () => props.documentId,
  () => getList(),
  { immediate: true },
);
</script>

<template>
  <!-- 文档评论 -->
  <ElDivider content-position="left">
    {{ commentCount ? `评论（${commentCount}）` : '评论' }}
  </ElDivider>
  <div v-loading="loading">
    <!-- 发表评论 -->
    <div class="mb-4">
      <ElInput
        v-model="newContent"
        :rows="2"
        maxlength="2000"
        placeholder="请输入评论内容"
        show-word-limit
        type="textarea"
      />
      <div class="mt-2 flex justify-end">
        <ElButton
          :loading="submitting"
          type="primary"
          @click="submitRootComment"
        >
          发表评论
        </ElButton>
      </div>
    </div>
    <ElEmpty
      v-if="comments.length === 0"
      :image-size="72"
      description="暂无评论"
    />
    <!-- 评论列表 -->
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="flex gap-3 border-0 border-b border-solid border-[var(--el-border-color-lighter)] py-4 text-sm leading-[1.6]"
    >
      <ElAvatar :size="32" class="knowledge-comment-avatar shrink-0">
        {{ comment.userName?.slice(0, 1) }}
      </ElAvatar>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2.5">
          <span class="font-medium">{{ comment.userName }}</span>
          <span class="text-xs text-[var(--el-text-color-secondary)]">
            {{ formatDateTime(comment.createTime) }}
          </span>
        </div>
        <div class="mt-1.5 whitespace-pre-wrap break-all">
          {{ comment.content }}
        </div>
        <div class="mt-1.5 flex items-center gap-3">
          <ElButton
            v-if="comment.userId === loginUserId"
            class="!ml-0"
            link
            type="danger"
            @click="handleDelete(comment)"
          >
            删除
          </ElButton>
          <ElButton link type="primary" @click="startReply(comment, comment)">
            回复
          </ElButton>
        </div>
        <!-- 评论回复 -->
        <div
          v-for="reply in comment.children"
          :key="reply.id"
          class="mt-3 flex gap-2.5 rounded bg-[var(--el-fill-color-light)] px-4 py-3"
        >
          <ElAvatar :size="28" class="knowledge-comment-avatar shrink-0">
            {{ reply.userName?.slice(0, 1) }}
          </ElAvatar>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2.5">
              <span class="font-medium">{{ reply.userName }}</span>
              <span class="text-xs text-[var(--el-text-color-secondary)]">
                {{ formatDateTime(reply.createTime) }}
              </span>
            </div>
            <div
              v-if="reply.replyUserName"
              class="mt-1 text-xs text-[var(--el-text-color-secondary)]"
            >
              回复 @{{ reply.replyUserName }}
            </div>
            <div class="mt-1 whitespace-pre-wrap break-all">
              {{ reply.content }}
            </div>
            <div class="mt-1.5 flex items-center gap-3">
              <ElButton
                v-if="reply.userId === loginUserId"
                class="!ml-0"
                link
                type="danger"
                @click="handleDelete(reply)"
              >
                删除
              </ElButton>
              <ElButton link type="primary" @click="startReply(comment, reply)">
                回复
              </ElButton>
            </div>
          </div>
        </div>
        <!-- 回复评论 -->
        <div v-if="replyMainId === comment.id" class="mt-2 flex gap-2">
          <ElInput
            v-model="replyContent"
            :placeholder="`回复 ${replyUserName}`"
            maxlength="2000"
            @keyup.enter="submitReply"
          />
          <ElButton :loading="submitting" type="primary" @click="submitReply">
            回复
          </ElButton>
          <ElButton @click="cancelReply">取消</ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-comment-avatar {
  --el-avatar-bg-color: var(--el-color-primary);

  color: #fff;
}
</style>
