<script lang="ts" setup>
import type { OaDiscussionApi } from '#/api/oa/discussion';
import type { OaDiscussionReplyApi } from '#/api/oa/discussion/reply';

import { nextTick, onMounted, reactive, ref, toRef } from 'vue';

import { confirm, ContentWrap } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { buildSortingField } from '@vben/request';
import { useUserStore } from '@vben/stores';
import { formatDate } from '@vben/utils';

import {
  Avatar,
  Button,
  Empty,
  message,
  Pagination,
  Popover,
  Select,
  Spin,
  Tag,
  Textarea,
} from 'ant-design-vue';

import {
  createDiscussionLike,
  deleteDiscussionLike,
} from '#/api/oa/discussion/like';
import {
  createDiscussionReply,
  deleteDiscussionReply,
  getDiscussionReplyPage,
} from '#/api/oa/discussion/reply';
import { $t } from '#/locales';

defineOptions({ name: 'OaDiscussionReply' });

const props = defineProps<{ detail: OaDiscussionApi.Discussion }>();
const emit = defineEmits(['success']); // 回复操作成功
const detail = toRef(props, 'detail'); // 讨论详情

const userStore = useUserStore(); // 用户信息 Store
const currentUserId = userStore.userInfo?.id; // 当前用户编号
const isSuperAdmin = !!userStore.userRoles?.includes('super_admin'); // 是否为超级管理员
const inlineContent = ref(''); // 楼层内回复内容
const submitLoading = ref(false); // 回复提交中
const replyLoading = ref(false); // 回复加载中
const replyList = ref<OaDiscussionReplyApi.DiscussionReply[]>([]); // 回复列表
const replyTotal = ref(0); // 回复总数
const replyContent = ref(''); // 回复内容
const replyVisible = ref(false); // 主回复输入框是否显示
const replyInputRef = ref(); // 主回复输入框
const replyRootId = ref<number>(); // 被回复对象所属楼层
const expandedReplies = reactive<Record<number, boolean>>({}); // 楼层评论展开状态，默认收起
const replyTarget = ref<OaDiscussionReplyApi.DiscussionReply>(); // 被回复对象
const replyScope = ref('all'); // 回复查看范围
const replySortOrder = ref('asc'); // 回复时间排序
const replyQueryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  discussionId: undefined as number | undefined,
  userId: undefined as number | undefined,
  sortingFields: [{ field: 'createTime', order: 'asc' }],
}); // 回复查询参数

/** 定位到主回复输入框 */
async function focusReply() {
  handleCancelReply();
  replyVisible.value = true;
  await nextTick();
  replyInputRef.value?.$el.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });
  replyInputRef.value?.focus();
}
defineExpose({ focusReply }); // 提供正文区回复入口

/** 取消回复，收起输入框并清空内容 */
function handleCancelReply() {
  replyVisible.value = false;
  replyContent.value = '';
  replyTarget.value = undefined;
  replyRootId.value = undefined;
  inlineContent.value = '';
}

/** 查询回复列表 */
async function getReplyList() {
  if (!replyQueryParams.discussionId) {
    return;
  }
  replyLoading.value = true;
  try {
    const { sortingFields, ...params } = replyQueryParams;
    const data = await getDiscussionReplyPage({
      ...params,
      ...buildSortingField(sortingFields),
    });
    replyList.value = data.list;
    replyTotal.value = data.total;
  } finally {
    replyLoading.value = false;
  }
}

/** 回复查看范围切换操作 */
function handleReplyScopeChange() {
  replyQueryParams.userId =
    replyScope.value === 'owner'
      ? detail.value?.userId
      : replyScope.value === 'mine'
        ? currentUserId
        : undefined;
  replyQueryParams.pageNo = 1;
  getReplyList();
}

/** 回复时间排序切换操作 */
function handleReplySortChange() {
  replyQueryParams.sortingFields = [
    { field: 'createTime', order: replySortOrder.value },
  ];
  replyQueryParams.pageNo = 1;
  getReplyList();
}

/** 点赞回复 */
async function handleReplyLike(reply: OaDiscussionReplyApi.DiscussionReply) {
  // 发起点赞或取消点赞
  if (reply.liked) {
    await deleteDiscussionLike(undefined, reply.id);
  } else {
    await createDiscussionLike(undefined, reply.id);
  }
  // 刷新回复列表
  await getReplyList();
}

/** 设置回复对象 */
function handleReply(reply: OaDiscussionReplyApi.DiscussionReply, rootId: number) {
  handleCancelReply();
  replyRootId.value = rootId;
  inlineContent.value = '';
  replyTarget.value = reply;
}

/** 获得楼层内的回复，保持父子关系顺序 */
function getChildReplies(
  reply: OaDiscussionReplyApi.DiscussionReply,
): OaDiscussionReplyApi.DiscussionReply[] {
  return (reply.children || []).flatMap((child) => [
    child,
    ...getChildReplies(child),
  ]);
}

/** 发表主回复或楼层内回复 */
async function submitReply(target?: OaDiscussionReplyApi.DiscussionReply) {
  if (submitLoading.value) {
    return;
  }
  submitLoading.value = true;
  try {
    // 提交回复
    await createDiscussionReply({
      discussionId: detail.value.id!,
      parentId: target?.id || 0,
      content: target ? inlineContent.value : replyContent.value,
    });
    message.success('回复成功');
    // 清空对应输入框并刷新楼层
    if (target) {
      // 发表成功后展开所属楼层，便于查看刚提交的评论
      expandedReplies[replyRootId.value!] = true;
      inlineContent.value = '';
      replyTarget.value = undefined;
    } else {
      replyContent.value = '';
      replyVisible.value = false;
      replyQueryParams.pageNo = 1;
    }
    await getReplyList();
    emit('success');
  } finally {
    submitLoading.value = false;
  }
}

/** 删除回复及其子回复 */
async function handleDeleteReply(id: number) {
  try {
    // 删除的二次确认
    await confirm($t('ui.actionMessage.deleteConfirm', [id]));
    await deleteDiscussionReply(id);
    message.success($t('ui.actionMessage.deleteSuccess', [id]));
    replyTarget.value = undefined;
    await getReplyList();
    // 删除最后一层后返回上一页
    if (!replyList.value.length && replyQueryParams.pageNo > 1) {
      replyQueryParams.pageNo--;
      await getReplyList();
    }
    emit('success');
  } catch {
    // 取消删除
  }
}

/** 初始化回复列表 */
onMounted(() => {
  replyQueryParams.discussionId = detail.value.id;
  getReplyList();
});
</script>

<template>
  <ContentWrap class="mt-4">
    <!-- 回复标题和筛选 -->
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3 px-3 py-2">
      <h3 class="m-0 text-base font-semibold">回复 {{ detail.replyCount || 0 }}</h3>
      <div class="flex gap-2">
        <Select
          v-model:value="replyScope"
          class="!w-[120px]"
          :options="[
            { label: '查看所有', value: 'all' },
            { label: '只看楼主', value: 'owner' },
            { label: '只看我的', value: 'mine' },
          ]"
          @change="handleReplyScopeChange"
        />
        <Select
          v-model:value="replySortOrder"
          class="!w-[120px]"
          :options="[
            { label: '时间升序', value: 'asc' },
            { label: '时间降序', value: 'desc' },
          ]"
          @change="handleReplySortChange"
        />
      </div>
    </div>
    <!-- 发表主回复 -->
    <div v-if="replyVisible" class="mb-3">
      <Textarea
        ref="replyInputRef"
        v-model:value="replyContent"
        :rows="3"
        show-count
        placeholder="分享你的看法，参与讨论"
      />
      <div class="mt-2 text-right">
        <Button :disabled="submitLoading" @click="handleCancelReply">
          取消
        </Button>
        <Button
          type="primary"
          class="ml-2"
          :loading="submitLoading"
          :disabled="!replyContent.trim()"
          @click="submitReply()"
        >
          发表回复
        </Button>
      </div>
    </div>
    <!-- 主回复按楼层分页 -->
    <Spin :spinning="replyLoading">
      <div
        v-for="(reply, index) in replyList"
        :key="reply.id"
        class="border-border border-t py-3"
      >
        <div class="flex items-center gap-2.5">
          <Avatar :size="36" class="shrink-0">
            {{ reply.userName?.slice(0, 1) }}
          </Avatar>
          <div>
            <span class="font-medium">{{ reply.userName }}</span>
            <Tag v-if="reply.userId === detail.userId" class="ml-2">楼主</Tag>
            <div class="text-muted-foreground mt-0.5 text-xs">
              {{ formatDate(reply.createTime) }}
            </div>
          </div>
        </div>
        <div class="my-2 whitespace-pre-wrap break-words leading-7">
          {{ reply.content }}
        </div>
        <!-- 楼层操作与楼层编号 -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1">
            <Button
              type="link"
              size="small"
              @click="handleReply(reply, reply.id!)"
            >
              <IconifyIcon icon="lucide:message-circle" class="mr-1" />
              回复
            </Button>
            <Button type="link" size="small" @click="handleReplyLike(reply)">
              <IconifyIcon
                :icon="reply.liked ? 'mdi:thumb-up' : 'mdi:thumb-up-outline'"
                class="mr-1"
              />
              {{ reply.liked ? '取消点赞' : '点赞' }}（{{ reply.likeCount || 0 }}）
            </Button>
            <Button
              v-if="getChildReplies(reply).length"
              type="link"
              size="small"
              @click="expandedReplies[reply.id!] = !expandedReplies[reply.id!]"
            >
              <IconifyIcon
                :icon="
                  expandedReplies[reply.id!]
                    ? 'lucide:chevron-up'
                    : 'lucide:chevron-down'
                "
                class="mr-1"
              />
              <span>{{ expandedReplies[reply.id!] ? '收起评论' : '展开评论' }}</span>
              <span>（{{ getChildReplies(reply).length }}）</span>
            </Button>
            <Button
              v-if="detail.userId === currentUserId || isSuperAdmin"
              type="link"
              size="small"
              danger
              @click="handleDeleteReply(reply.id!)"
            >
              删除
            </Button>
          </div>
          <span class="text-muted-foreground shrink-0 text-xs">
            {{ (replyQueryParams.pageNo - 1) * replyQueryParams.pageSize + index + 1 }} 楼
          </span>
        </div>
        <!-- 点赞摘要，完整名单按需查看 -->
        <div
          v-if="reply.likeUserNames?.length"
          class="text-muted-foreground mt-1.5 text-[13px]"
        >
          {{ reply.likeUserNames.slice(0, 3).join('、') }}，
          <Popover trigger="click" title="点赞人" :overlay-style="{ width: '260px' }">
            <template #content>
              <div class="break-words leading-7">
                {{ reply.likeUserNames.join('、') }}
              </div>
            </template>
            <Button type="link" size="small" class="!px-0">
              共 {{ reply.likeCount || 0 }} 人觉得很赞
            </Button>
          </Popover>
        </div>
        <!-- 楼层内评论使用紧凑列表，避免每条评论重复大块卡片 -->
        <div
          v-if="expandedReplies[reply.id!] && getChildReplies(reply).length"
          class="border-border ml-0 mt-2 border-l pl-3 sm:ml-11"
        >
          <div
            v-for="child in getChildReplies(reply)"
            :key="child.id"
            class="border-border flex flex-wrap items-start gap-x-3 gap-y-1 border-t py-2"
          >
            <div class="min-w-0 flex flex-1 items-start gap-2">
              <Avatar :size="24" class="shrink-0">
                {{ child.userName?.slice(0, 1) }}
              </Avatar>
              <div class="min-w-0 break-words text-[13px] leading-6">
                <span class="text-primary">{{ child.userName }}：</span>
                <span v-if="child.replyUserName" class="text-muted-foreground mr-1">
                  @{{ child.replyUserName }}
                </span>
                <span class="whitespace-pre-wrap">{{ child.content }}</span>
              </div>
            </div>
            <div class="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
              <span>{{ formatDate(child.createTime) }}</span>
              <Button
                type="link"
                size="small"
                @click="handleReply(child, reply.id!)"
              >
                <IconifyIcon icon="lucide:message-circle" class="mr-1" />
                回复
              </Button>
              <Button
                v-if="detail.userId === currentUserId || isSuperAdmin"
                type="link"
                size="small"
                danger
                @click="handleDeleteReply(child.id!)"
              >
                删除
              </Button>
            </div>
          </div>
        </div>
        <!-- 在所选楼层内回复，保持实际被回复人 -->
        <div
          v-if="replyTarget && replyRootId === reply.id"
          class="ml-0 mt-2 sm:ml-11"
        >
          <Textarea
            v-model:value="inlineContent"
            :rows="2"
            :maxlength="255"
            show-count
            :placeholder="`回复 ${replyTarget.userName}`"
          />
          <div class="mt-2 text-right">
            <Button :disabled="submitLoading" @click="handleCancelReply">
              取消
            </Button>
            <Button
              type="primary"
              class="ml-2"
              :loading="submitLoading"
              :disabled="!inlineContent.trim()"
              @click="submitReply(replyTarget)"
            >
              发表回复
            </Button>
          </div>
        </div>
      </div>
      <Empty
        v-if="!replyLoading && replyList.length === 0"
        description="暂无回复"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
        :image-style="{ height: '60px' }"
      />
      <!-- 分页 -->
      <div v-if="replyTotal > 0" class="mt-2 flex justify-end">
        <Pagination
          v-model:current="replyQueryParams.pageNo"
          v-model:page-size="replyQueryParams.pageSize"
          :total="replyTotal"
          show-size-changer
          @change="getReplyList"
        />
      </div>
    </Spin>
  </ContentWrap>
</template>
