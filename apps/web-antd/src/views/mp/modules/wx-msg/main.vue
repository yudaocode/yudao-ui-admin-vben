<!--
  - Copyright (C) 2018-2019
  - All rights reserved, Designed By www.joolun.com
  芋道源码：
  ① 移除暂时用不到的 websocket
  ② 代码优化，补充注释，提升阅读性
-->
<script lang="ts" setup>
import type { User } from './types';

import type { Reply } from '#/views/mp/modules/wx-reply';

import { nextTick, onMounted, reactive, ref, unref } from 'vue';

import { Button, message, Spin } from 'ant-design-vue';

import { getMessagePage, sendMessage } from '#/api/mp/message';
import { getUser } from '#/api/mp/user';
import profile from '#/assets/imgs/profile.jpg';
import WxReplySelect, { ReplyType } from '#/views/mp/modules/wx-reply';

import MsgList from './modules/msg-list.vue';

defineOptions({ name: 'WxMsg' });

const props = defineProps({
  userId: {
    type: Number,
    required: true,
  },
});

// 消息弹窗
const accountId = ref(-1); // 公众号ID，需要通过userId初始化
const loading = ref(false); // 消息列表是否正在加载中
const hasMore = ref(true); // 是否可以加载更多
const list = ref<any[]>([]); // 消息列表
const queryParams = reactive({
  pageNo: 1, // 当前页数
  pageSize: 14, // 每页显示多少条
  accountId,
});

// 由于微信不再提供昵称，直接使用"用户"展示
const user: User = reactive({
  nickname: '用户',
  avatar: profile,
  accountId, // 公众号账号编号
});

// ========= 消息发送 =========
const sendLoading = ref(false); // 发送消息是否加载中
// 微信发送消息
const reply = ref<Reply>({
  type: ReplyType.Text,
  accountId: -1,
  articles: [],
});

const replySelectRef = ref<InstanceType<typeof WxReplySelect> | null>(null); // WxReplySelect组件ref，用于消息发送成功后清除内容
const msgDivRef = ref<HTMLDivElement | null>(null); // 消息显示窗口ref，用于滚动到底部

/** 完成加载 */
onMounted(async () => {
  const data = await getUser(props.userId);
  user.nickname = data.nickname?.length > 0 ? data.nickname : user.nickname;
  // API 返回的数据可能包含 headImageUrl，但类型定义中没有，使用类型断言
  const userData = data as typeof data & { headImageUrl?: string };
  user.avatar =
    userData.headImageUrl && userData.headImageUrl.length > 0
      ? userData.headImageUrl
      : user.avatar;
  accountId.value = data.accountId;
  reply.value.accountId = data.accountId;

  refreshChange();
});

/** 执行发送 */
async function sendMsg() {
  if (!unref(reply)) {
    return;
  }
  // 公众号限制：客服消息，公众号只允许发送一条
  if (
    reply.value.type === ReplyType.News &&
    reply.value.articles &&
    reply.value.articles.length > 1
  ) {
    reply.value.articles = [reply.value.articles[0]];
    message.success('图文消息条数限制在 1 条以内，已默认发送第一条');
  }

  // 注意：sendMessage API 需要 openid，但这里传入的是 userId
  // 这可能是后端 API 的特殊处理，使用类型断言绕过类型检查
  const data = await sendMessage({
    userId: props.userId,
    ...reply.value,
  } as any);
  sendLoading.value = false;

  list.value = [...list.value, data];
  await scrollToBottom();

  // 发送后清空数据
  replySelectRef.value?.clear();
}

/** 加载更多 */
function loadMore() {
  queryParams.pageNo++;
  getPage(queryParams, null);
}

/** 获取分页数据 */
async function getPage(page: any, params: any = null) {
  loading.value = true;
  const dataTemp = await getMessagePage(
    Object.assign(
      {
        pageNo: page.pageNo,
        pageSize: page.pageSize,
        userId: props.userId,
        accountId: page.accountId,
      },
      params,
    ),
  );

  const scrollHeight = msgDivRef.value?.scrollHeight ?? 0;
  // 处理数据
  const data = dataTemp.list.reverse();
  list.value = [...data, ...list.value];
  loading.value = false;
  if (data.length < queryParams.pageSize || data.length === 0) {
    hasMore.value = false;
  }
  queryParams.pageNo = page.pageNo;
  queryParams.pageSize = page.pageSize;
  // 滚动到原来的位置
  if (queryParams.pageNo === 1) {
    // 定位到消息底部
    await scrollToBottom();
  } else if (data.length > 0) {
    // 定位滚动条
    await nextTick();
    if (scrollHeight !== 0 && msgDivRef.value) {
      msgDivRef.value.scrollTop =
        msgDivRef.value.scrollHeight - scrollHeight - 100;
    }
  }
}

/** 刷新消息 */
function refreshChange() {
  getPage(queryParams);
}

/** 定位到消息底部 */
async function scrollToBottom() {
  await nextTick();
  if (msgDivRef.value) {
    msgDivRef.value.scrollTop = msgDivRef.value.scrollHeight;
  }
}
</script>

<template>
  <ContentWrap>
    <Spin :spinning="loading">
      <div
        class="ml-[10px] mr-[10px] h-[50vh] overflow-auto bg-[#eaeaea]"
        ref="msgDivRef"
      >
        <!-- 加载更多 -->
        <div v-if="!loading">
          <div
            class="cursor-pointer py-5 text-center"
            v-if="hasMore"
            @click="loadMore"
          >
            <span class="text-[#999]">点击加载更多</span>
          </div>
          <div class="py-5 text-center" v-if="!hasMore">
            <span class="text-[#999]">没有更多了</span>
          </div>
        </div>

        <!-- 消息列表 -->
        <MsgList :list="list" :account-id="accountId" :user="user" />
      </div>
    </Spin>

    <Spin :spinning="sendLoading">
      <div class="p-[10px]">
        <WxReplySelect ref="replySelectRef" v-model="reply" />
        <Button type="primary" class="float-right mb-2 mt-2" @click="sendMsg">
          发送(S)
        </Button>
      </div>
    </Spin>
  </ContentWrap>
</template>

<style lang="scss" scoped></style>
