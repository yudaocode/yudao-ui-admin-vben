<script lang="ts" setup>
import type { OaDiscussionApi } from '#/api/oa/discussion';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { ContentWrap, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import { ElAvatar, ElButton, ElDivider, ElLink, ElPopover } from 'element-plus';

import { getDiscussion } from '#/api/oa/discussion';
import {
  createDiscussionLike,
  deleteDiscussionLike,
} from '#/api/oa/discussion/like';
import { OA_DISCUSSION_TYPE } from '#/views/oa/utils/constants';

import Reply from './modules/reply.vue';
import Vote from './modules/vote.vue';

defineOptions({ name: 'OaDiscussionDetail' });

const route = useRoute();
const loading = ref(false); // 详情加载中
const likeLoading = ref(false); // 点赞提交中
const detail = ref<OaDiscussionApi.Discussion>(); // 讨论详情
const replyRef = ref<InstanceType<typeof Reply>>(); // 回复区域

/** 查询讨论详情，只有进入页面时记录访问 */
async function getDetail(visit = false) {
  detail.value = await getDiscussion(Number(route.params.id), visit);
}

/** 点赞或取消点赞 */
async function handleDiscussionLike() {
  if (!detail.value?.id || likeLoading.value) {
    return;
  }
  likeLoading.value = true;
  try {
    if (detail.value.liked) {
      await deleteDiscussionLike(detail.value.id);
    } else {
      await createDiscussionLike(detail.value.id);
    }
    await getDetail();
  } finally {
    likeLoading.value = false;
  }
}

/** 初始化详情，兼容在不同讨论之间切换 */
watch(
  () => route.params.id,
  async (id) => {
    if (route.name !== 'OaDiscussionDetail' || !id) {
      return;
    }
    detail.value = undefined;
    loading.value = true;
    try {
      await getDetail(true);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page>
    <div v-loading="loading">
      <template v-if="detail">
        <!-- 主题正文 -->
        <ContentWrap>
          <h1 class="mb-3 mt-0 break-words text-2xl font-semibold leading-9">
            {{ detail.title }}
          </h1>
          <div
            class="text-muted-foreground flex flex-wrap items-center gap-3 text-[13px]"
          >
            <ElAvatar :size="36">{{ detail.userName?.slice(0, 1) }}</ElAvatar>
            <span class="text-foreground">{{ detail.userName }}</span>
            <span>{{ formatDate(detail.createTime) }}</span>
          </div>
          <ElDivider class="!my-4" />
          <div
            class="oa-discussion-content break-words text-[15px] leading-7"
            v-dompurify-html="detail.content || ''"
          ></div>
          <!-- 附件 -->
          <div v-if="detail.fileUrls?.length" class="border-border mt-4 border-t pt-3">
            <h3 class="mb-3 mt-0 text-sm font-medium">附件</h3>
            <ElLink
              v-for="(url, index) in detail.fileUrls"
              :key="url"
              type="primary"
              underline="never"
              :href="url"
              target="_blank"
              class="mr-4"
            >
              附件 {{ index + 1 }}
            </ElLink>
          </div>
          <!-- 投票 -->
          <Vote
            v-if="detail.type === OA_DISCUSSION_TYPE.VOTE"
            :detail="detail"
            @success="getDetail()"
          />
          <!-- 点赞统计，名单按需展开 -->
          <div
            class="border-border mt-4 flex flex-wrap items-center gap-2 border-t pt-3 [&>.el-button]:!ml-0"
          >
            <ElButton link type="primary" @click="replyRef?.focusReply()">
              <IconifyIcon icon="lucide:message-circle" class="mr-1" />
              回复
            </ElButton>
            <span
              class="text-muted-foreground inline-flex items-center text-[13px]"
            >
              <IconifyIcon icon="lucide:eye" class="mr-1" />
              浏览（{{ detail.visitCount || 0 }}）
            </span>
            <span
              class="text-muted-foreground inline-flex items-center text-[13px]"
            >
              <IconifyIcon icon="lucide:message-circle" class="mr-1" />
              回复（{{ detail.replyCount || 0 }}）
            </span>
            <ElButton
              link
              type="primary"
              :loading="likeLoading"
              @click="handleDiscussionLike"
            >
              <IconifyIcon
                :icon="detail.liked ? 'mdi:thumb-up' : 'mdi:thumb-up-outline'"
                class="mr-1"
              />
              {{ detail.liked ? '取消点赞' : '点赞' }}（{{ detail.likeCount || 0 }}）
            </ElButton>
          </div>
          <!-- 点赞人摘要 -->
          <div
            v-if="detail.likeUserNames?.length"
            class="text-muted-foreground mt-1.5 text-[13px]"
          >
            {{ detail.likeUserNames.slice(0, 3).join('、') }}，
            <ElPopover trigger="click" title="点赞人" :width="260">
              <template #reference>
                <ElButton link>共 {{ detail.likeCount || 0 }} 人觉得很赞</ElButton>
              </template>
              <div class="break-words leading-7">
                {{ detail.likeUserNames.join('、') }}
              </div>
            </ElPopover>
          </div>
        </ContentWrap>
        <!-- 讨论楼层 -->
        <Reply
          ref="replyRef"
          :key="detail.id"
          :detail="detail"
          @success="getDetail()"
        />
      </template>
    </div>
  </Page>
</template>

<style scoped>
.oa-discussion-content :deep(> :first-child) {
  margin-top: 0;
}

.oa-discussion-content :deep(> :last-child) {
  margin-bottom: 0;
}

.oa-discussion-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.oa-discussion-content :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}

.oa-discussion-content :deep(pre) {
  overflow-x: auto;
}
</style>
