<script lang="ts" setup>
import type { PmsWorkItemCommentApi } from '#/api/pms/pm/workitem/comment';

import { computed, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import {
  Avatar,
  Button,
  Empty,
  message,
  Popconfirm,
  Textarea,
} from 'ant-design-vue';

import {
  createWorkItemComment,
  deleteWorkItemComment,
  getWorkItemCommentList,
  updateWorkItemComment,
} from '#/api/pms/pm/workitem/comment';

defineOptions({ name: 'PmsWorkItemComment' });

// TODO @AI：评论区可以保留自定义；antd/antdv-next 不要用 v-loading。三端模板对齐。

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
    message.warning('请输入评论内容');
    return;
  }
  submitting.value = true;
  try {
    await createWorkItemComment({
      workItemId: props.workItemId,
      content: newContent.value,
    });
    message.success('评论成功');
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
    message.warning('请输入回复内容');
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
    message.success('回复成功');
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
    message.warning('请输入评论内容');
    return;
  }
  await updateWorkItemComment({
    ...comment,
    content: editingContent.value,
  });
  message.success('更新成功');
  cancelEdit();
  await getCommentList();
  emit('changed');
}

/** 删除评论 */
async function handleDelete(comment: PmsWorkItemCommentApi.WorkItemComment) {
  await deleteWorkItemComment(comment.id!);
  message.success('删除成功');
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
    <div v-if="showTitle" class="mb-3 font-semibold">评论</div>
    <div v-loading="loading">
      <!-- 发表评论 -->
      <div v-if="editable" class="mb-5 flex items-start gap-3">
        <Avatar
          :size="34"
          :src="loginUser?.avatar"
          class="shrink-0 !bg-primary/100 !text-white"
        >
          {{ loginUser?.nickname?.slice(0, 1) }}
        </Avatar>
        <div class="min-w-0 flex-1">
          <Textarea
            v-model:value="newContent"
            :maxlength="2000"
            :rows="3"
            placeholder="请输入评论内容"
            show-count
          />
          <div class="mt-2 flex justify-end">
            <Button
              :loading="submitting"
              type="primary"
              @click="submitRootComment"
            >
              发表评论
            </Button>
          </div>
        </div>
      </div>
      <!-- 评论列表 -->
      <Empty v-if="commentList.length === 0" description="暂无评论" />
      <div
        v-for="comment in commentList"
        :key="comment.id"
        class="flex gap-3 border-0 border-b border-solid border-border py-4 text-sm leading-[1.6]"
      >
        <Avatar :size="32" class="shrink-0 !bg-primary/100 !text-white">
          {{ comment.userName?.slice(0, 1) }}
        </Avatar>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2.5">
            <span class="font-medium">{{ comment.userName || '-' }}</span>
            <span class="text-xs text-muted-foreground">
              {{ formatDateTime(comment.createTime) }}
            </span>
          </div>
          <Textarea
            v-if="editingId === comment.id"
            v-model:value="editingContent"
            :maxlength="2000"
            :rows="2"
            class="my-2"
          />
          <div v-else class="mt-1.5 whitespace-pre-wrap break-all">
            {{ comment.content }}
          </div>
          <div v-if="editable" class="mt-1.5 flex items-center gap-3">
            <template v-if="comment.userId === loginUserId">
              <Button
                v-if="editingId !== comment.id"
                class="!ml-0"
                size="small"
                type="link"
                @click="startEdit(comment)"
              >
                编辑
              </Button>
              <Button
                v-else
                class="!ml-0"
                size="small"
                type="link"
                @click="submitEdit(comment)"
              >
                保存
              </Button>
              <Button
                v-if="editingId === comment.id"
                class="!ml-0"
                size="small"
                type="link"
                @click="cancelEdit"
              >
                取消
              </Button>
              <Popconfirm
                cancel-text="取消"
                ok-text="确定"
                title="确认删除这条评论吗？"
                @confirm="handleDelete(comment)"
              >
                <Button class="!ml-0" danger size="small" type="link">
                  删除
                </Button>
              </Popconfirm>
            </template>
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
            v-for="reply in comment.children || []"
            :key="reply.id"
            class="mt-3 flex gap-2.5 rounded bg-accent px-4 py-3"
          >
            <Avatar :size="28" class="shrink-0 !bg-primary/100 !text-white">
              {{ reply.userName?.slice(0, 1) }}
            </Avatar>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2.5">
                <span class="font-medium">{{ reply.userName || '-' }}</span>
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
              <Textarea
                v-if="editingId === reply.id"
                v-model:value="editingContent"
                :maxlength="2000"
                :rows="2"
                class="my-2"
              />
              <div v-else class="mt-1 whitespace-pre-wrap break-all">
                {{ reply.content }}
              </div>
              <div v-if="editable" class="mt-1.5 flex items-center gap-3">
                <template v-if="reply.userId === loginUserId">
                  <Button
                    v-if="editingId !== reply.id"
                    class="!ml-0"
                    size="small"
                    type="link"
                    @click="startEdit(reply)"
                  >
                    编辑
                  </Button>
                  <Button
                    v-else
                    class="!ml-0"
                    size="small"
                    type="link"
                    @click="submitEdit(reply)"
                  >
                    保存
                  </Button>
                  <Button
                    v-if="editingId === reply.id"
                    class="!ml-0"
                    size="small"
                    type="link"
                    @click="cancelEdit"
                  >
                    取消
                  </Button>
                  <Popconfirm
                    cancel-text="取消"
                    ok-text="确定"
                    title="确认删除这条评论吗？"
                    @confirm="handleDelete(reply)"
                  >
                    <Button class="!ml-0" danger size="small" type="link">
                      删除
                    </Button>
                  </Popconfirm>
                </template>
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
          <div v-if="replyMainId === comment.id" class="mt-2.5 flex gap-2">
            <Textarea
              v-model:value="replyContent"
              :maxlength="2000"
              :placeholder="`回复 ${replyUserName}`"
              :rows="1"
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
  </div>
</template>
