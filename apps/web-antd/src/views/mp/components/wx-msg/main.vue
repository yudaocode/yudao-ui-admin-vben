<script lang="ts" setup>
import type { User } from './types';

import { nextTick, onMounted, reactive, ref, unref } from 'vue';

import { preferences } from '@vben/preferences';

import { Button, message, Spin } from 'ant-design-vue';

import { getMessagePage, sendMessage } from '#/api/mp/message';
import { getUser } from '#/api/mp/user';
import WxReplySelect from '#/views/mp/components/wx-reply';

import MsgList from './components/MsgList.vue';

defineOptions({ name: 'WxMsg' });

const props = defineProps<{
  userId: number;
}>();

const accountId = ref(-1); // 公众号ID，需要通过userId初始化
const loading = ref(false); // 消息列表是否正在加载中
const hasMore = ref(true); // 是否可以加载更多
const list = ref<any[]>([]); // 消息列表
const queryParams = reactive({
  accountId,
  pageNo: 1, // 当前页数
  pageSize: 14, // 每页显示多少条
});

// 由于微信不再提供昵称，直接使用"用户"展示
const user: User = reactive({
  accountId, // 公众号账号编号
  avatar: preferences.app.defaultAvatar,
  nickname: '用户',
});

// ========= 消息发送 =========
const sendLoading = ref(false); // 发送消息是否加载中
// 微信发送消息
const reply = ref<any>({
  accountId: -1,
  articles: [],
  type: 'text',
});

const replySelectRef = ref<InstanceType<typeof WxReplySelect> | null>(null); // WxReplySelect组件ref，用于消息发送成功后清除内容
const msgDivRef = ref<HTMLDivElement | null>(null); // 消息显示窗口ref，用于滚动到底部

/** 完成加载 */
onMounted(async () => {
  const data = await getUser(props.userId);
  user.nickname = data.nickname?.length > 0 ? data.nickname : user.nickname;
  user.avatar = data.avatar?.length > 0 ? data.avatar : user.avatar;
  accountId.value = data.accountId;
  reply.value.accountId = data.accountId;

  refreshChange();
});

// 执行发送
const sendMsg = async () => {
  if (!unref(reply)) {
    return;
  }
  // 公众号限制：客服消息，公众号只允许发送一条
  if (
    reply.value.type === 'news' &&
    reply.value.articles &&
    reply.value.articles.length > 1
  ) {
    reply.value.articles = [reply.value.articles[0]];
    message.success('图文消息条数限制在 1 条以内，已默认发送第一条');
  }

  const data = await sendMessage({
    ...reply.value,
    userId: props.userId,
  } as any);
  sendLoading.value = false;

  list.value = [...list.value, data];
  await scrollToBottom();

  // 发送后清空数据
  replySelectRef.value?.clear();
};

const loadMore = () => {
  queryParams.pageNo++;
  getPage(queryParams, null);
};

const getPage = async (page: any, params: any = null) => {
  loading.value = true;
  const dataTemp = await getMessagePage(
    Object.assign(
      {
        accountId: page.accountId,
        pageNo: page.pageNo,
        pageSize: page.pageSize,
        userId: props.userId,
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
};

const refreshChange = () => {
  getPage(queryParams);
};

/** 定位到消息底部 */
const scrollToBottom = async () => {
  await nextTick();
  if (msgDivRef.value) {
    msgDivRef.value.scrollTop = msgDivRef.value.scrollHeight;
  }
};
</script>

<template>
  <div class="wx-msg-container">
    <div ref="msgDivRef" class="msg-div">
      <!-- 加载更多 -->
      <Spin :spinning="loading" />
      <div v-if="!loading">
        <div v-if="hasMore" class="load-more-btn" @click="loadMore">
          <span>点击加载更多</span>
        </div>
        <div v-else class="load-more-btn disabled">
          <span>没有更多了</span>
        </div>
      </div>

      <!-- 消息列表 -->
      <MsgList :list="list" :account-id="accountId" :user="user" />
    </div>

    <div class="msg-send">
      <Spin :spinning="sendLoading">
        <WxReplySelect ref="replySelectRef" v-model="reply" />
        <Button type="primary" class="send-but" @click="sendMsg">
          发送(S)
        </Button>
      </Spin>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wx-msg-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.msg-div {
  flex: 1;
  height: 50vh;
  margin: 0 10px;
  overflow: auto;
  background-color: #eaeaea;
}

.load-more-btn {
  padding: 12px;
  font-size: 14px;
  color: #409eff;
  text-align: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #f5f7fa;
  }

  &.disabled {
    color: #909399;
    cursor: not-allowed;

    &:hover {
      background-color: transparent;
    }
  }
}

.msg-send {
  padding: 10px;
}

.send-but {
  float: right;
  margin-top: 8px;
  margin-bottom: 8px;
}
</style>
