<script lang="ts" setup>
import type { MallKefuConversationApi } from '#/api/mall/promotion/kefu/conversation';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatPast, jsonParse } from '@vben/utils';

import { Avatar, Badge, Layout, message } from 'ant-design-vue';

import {
  deleteConversation,
  updateConversationPinned,
} from '#/api/mall/promotion/kefu/conversation';
import { useMallKefuStore } from '#/store/mall/kefu';

import { KeFuMessageContentTypeEnum } from './tools/constants';
import { useEmoji } from './tools/emoji';

defineOptions({ name: 'KeFuConversationList' });

/** 打开右侧的消息列表 */
const emits = defineEmits<{
  (e: 'change', v: MallKefuConversationApi.Conversation): void;
}>();
const kefuStore = useMallKefuStore(); // 客服缓存
const { replaceEmoji } = useEmoji();
const activeConversationId = ref(-1); // 选中的会话
const collapse = ref(false); // 折叠菜单

/** 计算消息最后发送时间距离现在过去了多久 */
const lastMessageTimeMap = ref<Map<number, string>>(new Map<number, string>());
function calculationLastMessageTime() {
  kefuStore.getConversationList?.forEach((item) => {
    lastMessageTimeMap.value.set(
      item.id,
      formatPast(item.lastMessageTime, 'YYYY-MM-DD'),
    );
  });
}
defineExpose({ calculationLastMessageTime });

function openRightMessage(item: MallKefuConversationApi.Conversation) {
  // 同一个会话则不处理
  if (activeConversationId.value === item.id) {
    return;
  }
  activeConversationId.value = item.id;
  emits('change', item);
}

/** 获得消息类型 */
const getConversationDisplayText = computed(
  () => (lastMessageContentType: number, lastMessageContent: string) => {
    switch (lastMessageContentType) {
      case KeFuMessageContentTypeEnum.IMAGE: {
        return '[图片消息]';
      }
      case KeFuMessageContentTypeEnum.ORDER: {
        return '[订单消息]';
      }
      case KeFuMessageContentTypeEnum.PRODUCT: {
        return '[商品消息]';
      }
      case KeFuMessageContentTypeEnum.SYSTEM: {
        return '[系统消息]';
      }
      case KeFuMessageContentTypeEnum.TEXT: {
        return replaceEmoji(
          jsonParse(lastMessageContent).text || lastMessageContent,
        );
      }
      case KeFuMessageContentTypeEnum.VIDEO: {
        return '[视频消息]';
      }
      case KeFuMessageContentTypeEnum.VOICE: {
        return '[语音消息]';
      }
      default: {
        return '';
      }
    }
  },
);

// ======================= 右键菜单 =======================
const showRightMenu = ref(false); // 显示右键菜单
const rightMenuStyle = ref<any>({}); // 右键菜单 Style
const rightClickConversation = ref<MallKefuConversationApi.Conversation>(
  {} as MallKefuConversationApi.Conversation,
); // 右键选中的会话对象

/** 打开右键菜单 */
function rightClick(
  mouseEvent: PointerEvent,
  item: MallKefuConversationApi.Conversation,
) {
  rightClickConversation.value = item;
  // 显示右键菜单
  showRightMenu.value = true;
  rightMenuStyle.value = {
    top: `${mouseEvent.clientY - 110}px`,
    left: collapse.value
      ? `${mouseEvent.clientX - 80}px`
      : `${mouseEvent.clientX - 210}px`,
  };
}
/** 关闭右键菜单 */
function closeRightMenu() {
  showRightMenu.value = false;
}

/** 置顶会话 */
async function updateConversationPinnedFn(pinned: boolean) {
  // 1. 会话置顶/取消置顶
  await updateConversationPinned({
    id: rightClickConversation.value.id,
    pinned,
  });
  message.success(pinned ? '置顶成功' : '取消置顶成功');
  // 2. 关闭右键菜单，更新会话列表
  closeRightMenu();
  await kefuStore.updateConversation(rightClickConversation.value.id);
}

/** 删除会话 */
async function deleteConversationFn() {
  // 1. 删除会话
  confirm({
    content: '您确定要删除该会话吗？',
  }).then(async () => {
    await deleteConversation(rightClickConversation.value.id);
    // 2. 关闭右键菜单，更新会话列表
    closeRightMenu();
    kefuStore.deleteConversation(rightClickConversation.value.id);
  });
}

/** 监听右键菜单的显示状态，添加点击事件监听器 */
watch(showRightMenu, (val) => {
  if (val) {
    document.body.addEventListener('click', closeRightMenu);
  } else {
    document.body.removeEventListener('click', closeRightMenu);
  }
});

const timer = ref<any>();

/** 初始化 */
onMounted(() => {
  timer.value = setInterval(calculationLastMessageTime, 1000 * 10); // 十秒计算一次
});

/** 组件卸载前 */
onBeforeUnmount(() => {
  clearInterval(timer.value);
});
</script>

<template>
  <Layout.Sider class="kefu h-full pt-[5px]" width="260px">
    <div class="color-[#999] my-[10px] font-bold">
      会话记录({{ kefuStore.getConversationList.length }})
    </div>
    <div
      v-for="item in kefuStore.getConversationList"
      :key="item.id"
      :class="{
        active: item.id === activeConversationId,
        pinned: item.adminPinned,
      }"
      class="kefu-conversation flex items-center px-[10px]"
      @click="openRightMessage(item)"
      @contextmenu.prevent="rightClick($event as PointerEvent, item)"
    >
      <div class="!flex w-full items-center justify-center">
        <div class="w-50[px] h-50[px] flex items-center justify-center">
          <!-- 头像 + 未读 -->
          <Badge
            :hidden="item.adminUnreadMessageCount === 0"
            :max="99"
            :value="item.adminUnreadMessageCount"
          >
            <Avatar :src="item.userAvatar" alt="avatar" />
          </Badge>
        </div>
        <div class="ml-[10px] w-full">
          <div class="!flex w-full items-center justify-between">
            <span class="username">{{ item.userNickname || 'null' }}</span>
            <span class="color-[#999]" style="font-size: 13px">
              {{ lastMessageTimeMap.get(item.id) ?? '计算中' }}
            </span>
          </div>
          <!-- 最后聊天内容 -->
          <div
            v-dompurify-html="
              getConversationDisplayText(
                item.lastMessageContentType,
                item.lastMessageContent,
              )
            "
            class="last-message color-[#999] !flex items-center"
          ></div>
        </div>
      </div>
    </div>

    <!-- 右键，进行操作（类似微信） -->
    <ul v-show="showRightMenu" :style="rightMenuStyle" class="right-menu-ul">
      <li
        v-show="!rightClickConversation.adminPinned"
        class="flex items-center"
        @click.stop="updateConversationPinnedFn(true)"
      >
        <IconifyIcon class="mr-[5px]" icon="ep:top" />
        置顶会话
      </li>
      <li
        v-show="rightClickConversation.adminPinned"
        class="flex items-center"
        @click.stop="updateConversationPinnedFn(false)"
      >
        <IconifyIcon class="mr-[5px]" icon="ep:bottom" />
        取消置顶
      </li>
      <li class="flex items-center" @click.stop="deleteConversationFn">
        <IconifyIcon class="mr-[5px]" color="red" icon="ep:delete" />
        删除会话
      </li>
      <li class="flex items-center" @click.stop="closeRightMenu">
        <IconifyIcon class="mr-[5px]" color="red" icon="ep:close" />
        取消
      </li>
    </ul>
  </Layout.Sider>
</template>

<style lang="scss" scoped>
/** TODO @jave：看看哪些可以用 tailwind 简化掉 */
.kefu {
  background-color: var(--app-content-bg-color);

  &-conversation {
    height: 60px;
    //background-color: #fff;
    //transition: border-left 0.05s ease-in-out; /* 设置过渡效果 */

    .username {
      min-width: 0;
      max-width: 60%;
    }

    .last-message {
      font-size: 13px;
    }

    .last-message,
    .username {
      display: -webkit-box;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }
  }

  .active {
    background-color: rgb(128 128 128 / 50%); // 透明色，暗黑模式下也能体现
  }

  .right-menu-ul {
    position: absolute;
    width: 130px;
    padding: 5px;
    margin: 0;
    list-style-type: none; /* 移除默认的项目符号 */
    background-color: var(--app-content-bg-color);
    border-radius: 12px;
    box-shadow: 0 2px 4px rgb(0 0 0 / 10%); /* 阴影效果 */

    li {
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 12px;
      transition: background-color 0.3s; /* 平滑过渡 */
      &:hover {
        background-color: var(
          --left-menu-bg-active-color
        ); /* 悬停时的背景颜色 */
      }
    }
  }
}
</style>
