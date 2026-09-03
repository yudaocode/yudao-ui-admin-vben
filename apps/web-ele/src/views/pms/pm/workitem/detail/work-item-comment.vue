<script lang="ts" setup>
import type { PmsWorkItemCommentApi } from '#/api/pms/pm/workitem/comment';

import { computed, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import {
  ElAvatar,
  ElButton,
  ElDivider,
  ElEmpty,
  ElInput,
  ElMessage,
  ElPopconfirm,
} from 'element-plus';

import {
  createWorkItemComment,
  deleteWorkItemComment,
  getWorkItemCommentList,
  updateWorkItemComment,
} from '#/api/pms/pm/workitem/comment';

defineOptions({ name: 'PmsWorkItemComment' });

const props = withDefaults(
  defineProps<{
    editable: boolean;
    showTitle?: boolean;
    workItemId: number;
  }>(),
  { showTitle: true },
);

const emit = defineEmits<{ changed: [] }>(); // 定义 changed 事件，用于评论变化后的回调

const loginUser = computed(() => useUserStore().userInfo); // 当前登录用户
const loginUserId = computed(() => loginUser.value?.id); // 当前登录用户编号
const loading = ref(false); // 评论加载中
const submitting = ref(false); // 评论提交中
const commentList = ref<PmsWorkItemCommentApi.WorkItemComment[]>([]); // 评论列表
const newContent = ref(''); // 新评论内容
const replyMainId = ref<number>(); // 当前回复的主评论编号
const replyUserId = ref<number>(); // 当前回复对象用户编号
const replyUserName = ref(''); // 当前回复对象姓名
const replyContent = ref(''); // 回复内容
const editingId = ref<number>(); // 当前编辑的评论编号
const editingContent = ref(''); // 编辑中的评论内容

/** 查询工作项评论列表 */
async function getCommentList() {
  loading.value = true;
  try {
    commentList.value = await getWorkItemCommentList(props.workItemId);
  } finally {
    loading.value = false;
  }
}

/** 发表评论 */
async function submitRootComment() {
  if (!newContent.value.trim()) {
    ElMessage.warning('请输入评论内容');
    return;
  }
  submitting.value = true;
  try {
    await createWorkItemComment({
      workItemId: props.workItemId,
      content: newContent.value,
    });
    ElMessage.success('评论成功');
    newContent.value = '';
    await getCommentList();
    emit('changed');
  } finally {
    submitting.value = false;
  }
}

/** 开始回复评论 */
function startReply(
  mainComment: PmsWorkItemCommentApi.WorkItemComment,
  targetComment: PmsWorkItemCommentApi.WorkItemComment,
) {
  replyMainId.value = mainComment.id;
  replyUserId.value = targetComment.userId;
  replyUserName.value = targetComment.userName || '-';
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
  if (!replyContent.value.trim() || !replyMainId.value) {
    ElMessage.warning('请输入回复内容');
    return;
  }
  submitting.value = true;
  try {
    await createWorkItemComment({
      workItemId: props.workItemId,
      content: replyContent.value,
      mainId: replyMainId.value,
      replyUserId: replyUserId.value,
    });
    ElMessage.success('回复成功');
    cancelReply();
    await getCommentList();
    emit('changed');
  } finally {
    submitting.value = false;
  }
}

/** 开始编辑评论 */
function startEdit(comment: PmsWorkItemCommentApi.WorkItemComment) {
  editingId.value = comment.id;
  editingContent.value = comment.content;
}

/** 取消编辑评论 */
function cancelEdit() {
  editingId.value = undefined;
  editingContent.value = '';
}

/** 提交评论修改 */
async function submitEdit(comment: PmsWorkItemCommentApi.WorkItemComment) {
  if (!editingContent.value.trim()) {
    ElMessage.warning('请输入评论内容');
    return;
  }
  await updateWorkItemComment({
    ...comment,
    content: editingContent.value,
  });
  ElMessage.success('更新成功');
  cancelEdit();
  await getCommentList();
  emit('changed');
}

/** 删除评论 */
async function handleDelete(comment: PmsWorkItemCommentApi.WorkItemComment) {
  await deleteWorkItemComment(comment.id!);
  ElMessage.success('删除成功');
  await getCommentList();
  emit('changed');
}

/** 监听工作项变化并刷新评论 */
watch(
  () => props.workItemId,
  () => getCommentList(),
  { immediate: true },
);
</script>

<template>
  <div>
    <ElDivider v-if="showTitle" content-position="left">评论</ElDivider>
    <div v-loading="loading">
      <!-- 发表评论 -->
      <div v-if="editable" class="mb-5 flex items-start gap-3">
        <ElAvatar
          class="shrink-0 !bg-[var(--el-color-primary)] !text-white"
          :size="34"
          :src="loginUser?.avatar"
        >
          {{ loginUser?.nickname?.slice(0, 1) }}
        </ElAvatar>
        <div class="min-w-0 flex-1">
          <ElInput
            v-model="newContent"
            :rows="3"
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
      </div>
      <!-- 评论列表 -->
      <ElEmpty
        v-if="commentList.length === 0"
        description="暂无评论"
        :image-size="72"
      />
      <div
        v-for="comment in commentList"
        :key="comment.id"
        class="flex gap-3 border-0 border-b border-solid border-[var(--el-border-color-lighter)] py-4 text-sm leading-[1.6]"
      >
        <ElAvatar
          class="shrink-0 !bg-[var(--el-color-primary)] !text-white"
          :size="32"
        >
          {{ comment.userName?.slice(0, 1) }}
        </ElAvatar>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2.5">
            <span class="font-medium">{{ comment.userName || '-' }}</span>
            <span class="text-xs text-[var(--el-text-color-secondary)]">
              {{ formatDateTime(comment.createTime) }}
            </span>
          </div>
          <ElInput
            v-if="editingId === comment.id"
            v-model="editingContent"
            class="my-2"
            :rows="2"
            maxlength="2000"
            type="textarea"
          />
          <div v-else class="mt-1.5 whitespace-pre-wrap break-all">
            {{ comment.content }}
          </div>
          <div v-if="editable" class="mt-1.5 flex items-center gap-3">
            <template v-if="comment.userId === loginUserId">
              <ElButton
                v-if="editingId !== comment.id"
                class="!ml-0"
                link
                type="primary"
                @click="startEdit(comment)"
              >
                编辑
              </ElButton>
              <ElButton
                v-else
                class="!ml-0"
                link
                type="primary"
                @click="submitEdit(comment)"
              >
                保存
              </ElButton>
              <ElButton
                v-if="editingId === comment.id"
                class="!ml-0"
                link
                @click="cancelEdit"
              >
                取消
              </ElButton>
              <ElPopconfirm
                cancel-button-text="取消"
                confirm-button-text="确定"
                title="确认删除这条评论吗？"
                width="220"
                @confirm="handleDelete(comment)"
              >
                <template #reference>
                  <ElButton class="!ml-0" link type="danger">删除</ElButton>
                </template>
              </ElPopconfirm>
            </template>
            <ElButton
              class="!ml-0"
              link
              type="primary"
              @click="startReply(comment, comment)"
            >
              回复
            </ElButton>
          </div>
          <!-- 评论回复 -->
          <div
            v-for="reply in comment.children || []"
            :key="reply.id"
            class="mt-3 flex gap-2.5 rounded bg-[var(--el-fill-color-light)] px-4 py-3"
          >
            <ElAvatar
              class="shrink-0 !bg-[var(--el-color-primary)] !text-white"
              :size="28"
            >
              {{ reply.userName?.slice(0, 1) }}
            </ElAvatar>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2.5">
                <span class="font-medium">{{ reply.userName || '-' }}</span>
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
              <ElInput
                v-if="editingId === reply.id"
                v-model="editingContent"
                class="my-2"
                :rows="2"
                maxlength="2000"
                type="textarea"
              />
              <div v-else class="mt-1 whitespace-pre-wrap break-all">
                {{ reply.content }}
              </div>
              <div v-if="editable" class="mt-1.5 flex items-center gap-3">
                <template v-if="reply.userId === loginUserId">
                  <ElButton
                    v-if="editingId !== reply.id"
                    class="!ml-0"
                    link
                    type="primary"
                    @click="startEdit(reply)"
                  >
                    编辑
                  </ElButton>
                  <ElButton
                    v-else
                    class="!ml-0"
                    link
                    type="primary"
                    @click="submitEdit(reply)"
                  >
                    保存
                  </ElButton>
                  <ElButton
                    v-if="editingId === reply.id"
                    class="!ml-0"
                    link
                    @click="cancelEdit"
                  >
                    取消
                  </ElButton>
                  <ElPopconfirm
                    cancel-button-text="取消"
                    confirm-button-text="确定"
                    title="确认删除这条评论吗？"
                    width="220"
                    @confirm="handleDelete(reply)"
                  >
                    <template #reference>
                      <ElButton class="!ml-0" link type="danger">删除</ElButton>
                    </template>
                  </ElPopconfirm>
                </template>
                <ElButton
                  class="!ml-0"
                  link
                  type="primary"
                  @click="startReply(comment, reply)"
                >
                  回复
                </ElButton>
              </div>
            </div>
          </div>
          <!-- 回复评论 -->
          <div v-if="replyMainId === comment.id" class="mt-2.5 flex gap-2">
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
  </div>
</template>
