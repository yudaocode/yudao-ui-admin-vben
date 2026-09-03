<script lang="ts" setup>
import type { PmsKnowledgeDocumentCommentApi } from '#/api/pms/kb/interaction/comment';

import { computed, ref, watch } from 'vue';

import { confirm } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import {
  Avatar,
  Button,
  Divider,
  Empty,
  Input,
  message,
  TextArea,
} from 'antdv-next';

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
    message.warning('请输入评论内容');
    return;
  }
  submitting.value = true;
  try {
    // 2. 提交评论
    await createKnowledgeDocumentComment({
      documentId: props.documentId,
      content: newContent.value,
    } as unknown as PmsKnowledgeDocumentCommentApi.KnowledgeDocumentComment);
    message.success('评论成功');
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
    message.warning('请输入回复内容');
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
    message.success('回复成功');
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
    message.success('删除成功');
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
  <Divider title-placement="left">
    {{ commentCount ? `评论（${commentCount}）` : '评论' }}
  </Divider>
  <div v-loading="loading">
    <!-- 发表评论 -->
    <div class="mb-4">
      <TextArea
        v-model:value="newContent"
        :maxlength="2000"
        :rows="2"
        placeholder="请输入评论内容"
        show-count
      />
      <div class="mt-2 flex justify-end">
        <Button :loading="submitting" type="primary" @click="submitRootComment">
          发表评论
        </Button>
      </div>
    </div>
    <Empty v-if="comments.length === 0" description="暂无评论" />
    <!-- 评论列表 -->
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="flex gap-3 border-0 border-b border-solid border-border py-4 text-sm leading-[1.6]"
    >
      <Avatar :size="32" class="shrink-0 !bg-primary/100 !text-white">
        {{ comment.userName?.slice(0, 1) }}
      </Avatar>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2.5">
          <span class="font-medium">{{ comment.userName }}</span>
          <span class="text-xs text-muted-foreground">
            {{ formatDateTime(comment.createTime) }}
          </span>
        </div>
        <div class="mt-1.5 whitespace-pre-wrap break-all">
          {{ comment.content }}
        </div>
        <div class="mt-1.5 flex items-center gap-3">
          <Button
            v-if="comment.userId === loginUserId"
            class="!ml-0"
            danger
            size="small"
            type="link"
            @click="handleDelete(comment)"
          >
            删除
          </Button>
          <Button
            class="!ml-0"
            size="small"
            type="link"
            @click="startReply(comment, comment)"
          >
            回复
          </Button>
        </div>
        <!-- 评论回复 -->
        <div
          v-for="reply in comment.children"
          :key="reply.id"
          class="mt-3 flex gap-2.5 rounded bg-accent px-4 py-3"
        >
          <Avatar :size="28" class="shrink-0 !bg-primary/100 !text-white">
            {{ reply.userName?.slice(0, 1) }}
          </Avatar>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2.5">
              <span class="font-medium">{{ reply.userName }}</span>
              <span class="text-xs text-muted-foreground">
                {{ formatDateTime(reply.createTime) }}
              </span>
            </div>
            <div
              v-if="reply.replyUserName"
              class="mt-1 text-xs text-muted-foreground"
            >
              回复 @{{ reply.replyUserName }}
            </div>
            <div class="mt-1 whitespace-pre-wrap break-all">
              {{ reply.content }}
            </div>
            <div class="mt-1.5 flex items-center gap-3">
              <Button
                v-if="reply.userId === loginUserId"
                class="!ml-0"
                danger
                size="small"
                type="link"
                @click="handleDelete(reply)"
              >
                删除
              </Button>
              <Button
                class="!ml-0"
                size="small"
                type="link"
                @click="startReply(comment, reply)"
              >
                回复
              </Button>
            </div>
          </div>
        </div>
        <!-- 回复评论 -->
        <div v-if="replyMainId === comment.id" class="mt-2 flex gap-2">
          <Input
            v-model:value="replyContent"
            :maxlength="2000"
            :placeholder="`回复 ${replyUserName}`"
            @press-enter="submitReply"
          />
          <Button :loading="submitting" type="primary" @click="submitReply">
            回复
          </Button>
          <Button @click="cancelReply">取消</Button>
        </div>
      </div>
    </div>
  </div>
</template>
