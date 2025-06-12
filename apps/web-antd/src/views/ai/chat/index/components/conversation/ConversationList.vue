<script setup lang="ts">
import type { PropType } from 'vue';

import type { AiChatConversationApi } from '#/api/ai/chat/conversation';

import { h, onMounted, ref, toRefs, watch } from 'vue';

import { confirm, prompt, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Empty, Input, Layout, message } from 'ant-design-vue';

import {
  createChatConversationMy,
  deleteChatConversationMy,
  deleteChatConversationMyByUnpinned,
  getChatConversationMyList,
  updateChatConversationMy,
} from '#/api/ai/chat/conversation';

import RoleRepository from '../role/RoleRepository.vue';

// 加载中定时器
// 定义组件 props
const props = defineProps({
  activeId: {
    type: [Number, null] as PropType<null | number>,
    default: null,
  },
});
/** 新建对话 */

// 定义钩子
const emits = defineEmits([
  'onConversationCreate',
  'onConversationClick',
  'onConversationClear',
  'onConversationDelete',
]);
const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: RoleRepository,
});
// 定义属性
const searchName = ref<string>(''); // 对话搜索
const activeConversationId = ref<null | number>(null); // 选中的对话，默认为 null
const hoverConversationId = ref<null | number>(null); // 悬浮上去的对话
const conversationList = ref([] as AiChatConversationApi.ChatConversationVO[]); // 对话列表
const conversationMap = ref<any>({}); // 对话分组 (置顶、今天、三天前、一星期前、一个月前)
const loading = ref<boolean>(false); // 加载中
const loadingTime = ref<any>();

/** 搜索对话 */
const searchConversation = async () => {
  // 恢复数据
  if (searchName.value.trim().length === 0) {
    conversationMap.value = await getConversationGroupByCreateTime(
      conversationList.value,
    );
  } else {
    // 过滤
    const filterValues = conversationList.value.filter((item) => {
      return item.title.includes(searchName.value.trim());
    });
    conversationMap.value =
      await getConversationGroupByCreateTime(filterValues);
  }
};

/** 点击对话 */
const handleConversationClick = async (id: number) => {
  // 过滤出选中的对话
  const filterConversation = conversationList.value.find((item) => {
    return item.id === id;
  });
  // 回调 onConversationClick
  // noinspection JSVoidFunctionReturnValueUsed
  const success = emits('onConversationClick', filterConversation);
  // 切换对话
  if (success) {
    activeConversationId.value = id;
  }
};

/** 获取对话列表 */
const getChatConversationList = async () => {
  try {
    // 加载中
    loadingTime.value = setTimeout(() => {
      loading.value = true;
    }, 50);

    // 1.1 获取 对话数据
    conversationList.value = await getChatConversationMyList();
    // 1.2 排序
    conversationList.value.sort((a, b) => {
      return Number(b.createTime) - Number(a.createTime);
    });
    // 1.3 没有任何对话情况
    if (conversationList.value.length === 0) {
      activeConversationId.value = null;
      conversationMap.value = {};
      return;
    }

    // 2. 对话根据时间分组(置顶、今天、一天前、三天前、七天前、30 天前)
    conversationMap.value = await getConversationGroupByCreateTime(
      conversationList.value,
    );
  } finally {
    // 清理定时器
    if (loadingTime.value) {
      clearTimeout(loadingTime.value);
    }
    // 加载完成
    loading.value = false;
  }
};

/** 按照 creteTime 创建时间，进行分组 */
const getConversationGroupByCreateTime = async (
  list: AiChatConversationApi.ChatConversationVO[],
) => {
  // 排序、指定、时间分组(今天、一天前、三天前、七天前、30天前)
  // noinspection NonAsciiCharacters
  const groupMap: any = {
    置顶: [],
    今天: [],
    一天前: [],
    三天前: [],
    七天前: [],
    三十天前: [],
  };
  // 当前时间的时间戳
  const now = Date.now();
  // 定义时间间隔常量（单位：毫秒）
  const oneDay = 24 * 60 * 60 * 1000;
  const threeDays = 3 * oneDay;
  const sevenDays = 7 * oneDay;
  const thirtyDays = 30 * oneDay;
  for (const conversation of list) {
    // 置顶
    if (conversation.pinned) {
      groupMap['置顶'].push(conversation);
      continue;
    }
    // 计算时间差（单位：毫秒）
    const diff = now - Number(conversation.createTime);
    // 根据时间间隔判断
    if (diff < oneDay) {
      groupMap['今天'].push(conversation);
    } else if (diff < threeDays) {
      groupMap['一天前'].push(conversation);
    } else if (diff < sevenDays) {
      groupMap['三天前'].push(conversation);
    } else if (diff < thirtyDays) {
      groupMap['七天前'].push(conversation);
    } else {
      groupMap['三十天前'].push(conversation);
    }
  }
  return groupMap;
};
const createConversation = async () => {
  // 1. 新建对话
  const conversationId = await createChatConversationMy(
    {} as unknown as AiChatConversationApi.ChatConversationVO,
  );
  // 2. 获取对话内容
  await getChatConversationList();
  // 3. 选中对话
  await handleConversationClick(conversationId);
  // 4. 回调
  emits('onConversationCreate');
};

/** 修改对话的标题 */
const updateConversationTitle = async (
  conversation: AiChatConversationApi.ChatConversationVO,
) => {
  // 1. 二次确认
  prompt({
    async beforeClose(scope) {
      if (scope.isConfirm) {
        if (scope.value) {
          try {
            // 2. 发起修改
            await updateChatConversationMy({
              id: conversation.id,
              title: scope.value,
            } as AiChatConversationApi.ChatConversationVO);
            message.success('重命名成功');
            // 3. 刷新列表
            await getChatConversationList();
            // 4. 过滤当前切换的
            const filterConversationList = conversationList.value.filter(
              (item) => {
                return item.id === conversation.id;
              },
            );
            if (
              filterConversationList.length > 0 &&
              filterConversationList[0] && // tip：避免切换对话
              activeConversationId.value === filterConversationList[0].id
            ) {
              emits('onConversationClick', filterConversationList[0]);
            }
          } catch {
            return false;
          }
        } else {
          message.error('请输入标题');
          return false;
        }
      }
    },
    component: () => {
      return h(Input, {
        placeholder: '请输入标题',
        allowClear: true,
        defaultValue: conversation.title,
        rules: [{ required: true, message: '请输入标题' }],
      });
    },
    content: '请输入标题',
    title: '修改标题',
    modelPropName: 'value',
  });
};

/** 删除聊天对话 */
const deleteChatConversation = async (
  conversation: AiChatConversationApi.ChatConversationVO,
) => {
  try {
    // 删除的二次确认
    await confirm(`是否确认删除对话 - ${conversation.title}?`);
    // 发起删除
    await deleteChatConversationMy(conversation.id);
    message.success('对话已删除');
    // 刷新列表
    await getChatConversationList();
    // 回调
    emits('onConversationDelete', conversation);
  } catch {}
};
const handleClearConversation = async () => {
  try {
    await confirm('确认后对话会全部清空，置顶的对话除外。');
    await deleteChatConversationMyByUnpinned();
    message.success('操作成功!');
    // 清空 对话 和 对话内容
    activeConversationId.value = null;
    // 获取 对话列表
    await getChatConversationList();
    // 回调 方法
    emits('onConversationClear');
  } catch {}
};

/** 对话置顶 */
const handleTop = async (
  conversation: AiChatConversationApi.ChatConversationVO,
) => {
  // 更新对话置顶
  conversation.pinned = !conversation.pinned;
  await updateChatConversationMy(conversation);
  // 刷新对话
  await getChatConversationList();
};

// ============ 角色仓库 ============

/** 角色仓库抽屉 */
const handleRoleRepository = async () => {
  drawerApi.open();
};

/** 监听选中的对话 */
const { activeId } = toRefs(props);
watch(activeId, async (newValue) => {
  activeConversationId.value = newValue;
});

// 定义 public 方法
defineExpose({ createConversation });

/** 初始化 */
onMounted(async () => {
  // 获取 对话列表
  await getChatConversationList();
  // 默认选中
  if (props.activeId) {
    activeConversationId.value = props.activeId;
  } else {
    // 首次默认选中第一个
    if (conversationList.value.length > 0 && conversationList.value[0]) {
      activeConversationId.value = conversationList.value[0].id;
      // 回调 onConversationClick
      await emits('onConversationClick', conversationList.value[0]);
    }
  }
});
</script>

<template>
  <Layout.Sider width="260px" class="conversation-container h-full">
    <Drawer />
    <!-- 左顶部：对话 -->
    <div class="flex h-full" style="flex-direction: column">
      <Button
        class="w-1/1 btn-new-conversation"
        type="primary"
        @click="createConversation"
      >
        <IconifyIcon icon="ep:plus" class="mr-[5px]" />
        新建对话
      </Button>
      <!-- 左顶部：搜索对话 -->
      <Input
        v-model:value="searchName"
        size="large"
        class="search-input mt-[10px]"
        placeholder="搜索历史记录"
        @keyup="searchConversation"
      >
        <template #prefix>
          <IconifyIcon icon="ep:search" />
        </template>
      </Input>

      <!-- 左中间：对话列表 -->
      <div class="conversation-list">
        <!-- 情况一：加载中 -->
        <Empty v-if="loading" description="." v-loading="loading" />
        <!-- 情况二：按照 group 分组，展示聊天会话 list 列表 -->
        <div
          v-for="conversationKey in Object.keys(conversationMap)"
          :key="conversationKey"
        >
          <div
            class="conversation-item classify-title"
            v-if="conversationMap[conversationKey].length > 0"
          >
            <b class="mx-1">
              {{ conversationKey }}
            </b>
          </div>
          <div
            class="conversation-item"
            v-for="conversation in conversationMap[conversationKey]"
            :key="conversation.id"
            @click="handleConversationClick(conversation.id)"
            @mouseover="hoverConversationId = conversation.id"
            @mouseout="hoverConversationId = null"
          >
            <div
              :class="
                conversation.id === activeConversationId
                  ? 'conversation active'
                  : 'conversation'
              "
            >
              <div class="title-wrapper">
                <img
                  class="avatar"
                  :src="conversation.roleAvatar ?? '/static/gpt.svg'"
                />
                <span class="title">{{ conversation.title }}</span>
              </div>
              <div
                class="button-wrapper"
                v-show="hoverConversationId === conversation.id"
              >
                <Button
                  class="btn"
                  type="link"
                  @click.stop="handleTop(conversation)"
                >
                  <span
                    v-if="!conversation.pinned"
                    class="icon-[ant-design--arrow-up-outlined]"
                  ></span>
                  <span
                    v-if="conversation.pinned"
                    class="icon-[ant-design--arrow-down-outlined]"
                  ></span>
                </Button>
                <Button
                  class="btn"
                  type="link"
                  @click.stop="updateConversationTitle(conversation)"
                >
                  <IconifyIcon icon="ep:edit" />
                </Button>
                <Button
                  class="btn"
                  type="link"
                  @click.stop="deleteChatConversation(conversation)"
                >
                  <IconifyIcon icon="ep:delete" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 底部占位  -->
      <div class="w-100% h-[50px]"></div>
    </div>
    <!-- 左底部：工具栏 -->
    <div class="tool-box">
      <div @click="handleRoleRepository">
        <IconifyIcon icon="ep:user" />
        <span>角色仓库</span>
      </div>
      <div @click="handleClearConversation">
        <IconifyIcon icon="ep:delete" />
        <span>清空未置顶对话</span>
      </div>
    </div>
  </Layout.Sider>
</template>

<style scoped lang="scss">
.conversation-container {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 10px 0;
  overflow: hidden;
  background-color: hsl(var(--primary-foreground));

  .btn-new-conversation {
    width: 100%;
    height: 38px;
  }

  .search-input {
    margin-top: 20px;
  }

  .conversation-list {
    height: 100%;
    overflow: auto;

    .classify-title {
      padding-top: 10px;
    }

    .conversation-item {
      margin-top: 5px;
    }

    .conversation {
      display: flex;
      flex: 1;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 0 5px;
      line-height: 30px;
      cursor: pointer;
      border-radius: 5px;

      &.active {
        background-color: #e6e6e6;

        .button {
          display: inline-block;
        }
      }

      .title-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .title {
        max-width: 150px;
        padding: 2px 10px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 14px;
        font-weight: 400;
        color: rgb(0 0 0 / 77%);
        white-space: nowrap;
      }

      .avatar {
        display: flex;
        flex-direction: row;
        justify-items: center;
        width: 25px;
        height: 25px;
        border-radius: 5px;
      }

      // 对话编辑、删除
      .button-wrapper {
        right: 2px;
        display: flex;
        flex-direction: row;
        place-items: center center;
        color: #606266;

        .btn {
          padding: 0 5px 0 0;
          margin: 0;
        }
      }
    }
  }

  // 角色仓库、清空未设置对话
  .tool-box {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    //width: 100%;
    padding: 0 20px;
    line-height: 35px;
    color: var(--el-text-color);
    background-color: #f4f4f4;
    box-shadow: 0 0 1px 1px rgb(228 228 228 / 80%);

    > div {
      display: flex;
      align-items: center;
      padding: 0;
      margin: 0;
      color: #606266;
      cursor: pointer;

      > span {
        margin-left: 5px;
      }
    }
  }
}
</style>
