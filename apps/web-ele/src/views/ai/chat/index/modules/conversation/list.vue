<script setup lang="ts">
import type { PropType } from 'vue';

import type { AiChatConversationApi } from '#/api/ai/chat/conversation';

import { h, onMounted, ref, toRefs, watch } from 'vue';

import { confirm, prompt, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, SvgGptIcon } from '@vben/icons';

import {
  ElAside,
  ElAvatar,
  ElButton,
  ElEmpty,
  ElInput,
  ElMessage,
} from 'element-plus';

import {
  createChatConversationMy,
  deleteChatConversationMy,
  deleteChatConversationMyByUnpinned,
  getChatConversationMyList,
  updateChatConversationMy,
} from '#/api/ai/chat/conversation';
import { $t } from '#/locales';

import RoleRepository from '../role/repository.vue';

const props = defineProps({
  activeId: {
    type: [Number, null] as PropType<null | number>,
    default: null,
  },
});

const emits = defineEmits([
  'onConversationCreate',
  'onConversationClick',
  'onConversationClear',
  'onConversationDelete',
]);

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: RoleRepository,
});

const searchName = ref<string>(''); // 对话搜索
const activeConversationId = ref<null | number>(null); // 选中的对话，默认为 null
const hoverConversationId = ref<null | number>(null); // 悬浮上去的对话
const conversationList = ref([] as AiChatConversationApi.ChatConversation[]); // 对话列表
const conversationMap = ref<any>({}); // 对话分组 (置顶、今天、三天前、一星期前、一个月前)
const loading = ref<boolean>(false); // 加载中
const loadingTime = ref<any>();

/** 搜索对话 */
async function searchConversation() {
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
}

/** 点击对话 */
async function handleConversationClick(id: number) {
  // 过滤出选中的对话
  const filterConversation = conversationList.value.find((item) => {
    return item.id === id;
  });
  // 回调 onConversationClick
  // noinspection JSVoidFunctionReturnValueUsed
  const success = emits('onConversationClick', filterConversation) as any;
  // 切换对话
  if (success) {
    activeConversationId.value = id;
  }
}

/** 获取对话列表 */
async function getChatConversationList() {
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
}

/** 按照 creteTime 创建时间，进行分组 */
async function getConversationGroupByCreateTime(
  list: AiChatConversationApi.ChatConversation[],
) {
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
}

/** 新建对话 */
async function handleConversationCreate() {
  // 1. 创建对话
  const conversationId = await createChatConversationMy({
    roleId: undefined,
  } as unknown as AiChatConversationApi.ChatConversation);

  // 2. 刷新列表
  await getChatConversationList();

  // 3. 回调
  emits('onConversationCreate', conversationId);
}

/** 清空未置顶的对话 */
async function handleConversationClear() {
  await confirm({
    title: '清空未置顶的对话',
    content: h('div', {}, [
      h('p', '确认清空未置顶的对话吗？'),
      h('p', '清空后，未置顶的对话将被删除，无法恢复！'),
    ]),
  });
  // 清空
  await deleteChatConversationMyByUnpinned();
  // 刷新列表
  await getChatConversationList();
  // 回调
  emits('onConversationClear');
}

/** 删除对话 */
async function handleConversationDelete(id: number) {
  await confirm({
    title: '删除对话',
    content: h('div', {}, [
      h('p', '确认删除该对话吗？'),
      h('p', '删除后，该对话将被删除，无法恢复！'),
    ]),
  });
  // 删除
  await deleteChatConversationMy(id);
  // 刷新列表
  await getChatConversationList();
  // 回调
  emits('onConversationDelete', id);
}

/** 置顶对话 */
async function handleConversationPin(conversation: any) {
  // 更新
  await updateChatConversationMy({
    id: conversation.id,
    pinned: !conversation.pinned,
  } as AiChatConversationApi.ChatConversation);
  // 刷新列表
  await getChatConversationList();
}

/** 编辑对话 */
async function handleConversationEdit(conversation: any) {
  const title = await prompt({
    title: '编辑对话',
    content: '请输入对话标题',
    defaultValue: conversation.title,
  });
  // 更新
  await updateChatConversationMy({
    id: conversation.id,
    title,
  } as AiChatConversationApi.ChatConversation);
  // 刷新列表
  await getChatConversationList();
  // 提示
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
}

/** 打开角色仓库 */
async function handleRoleRepositoryOpen() {
  drawerApi.open();
}

/** 监听 activeId 变化 */
watch(
  () => props.activeId,
  (newValue) => {
    activeConversationId.value = newValue;
  },
);

const { activeId } = toRefs(props);

/** 初始化 */
onMounted(async () => {
  // 获取对话列表
  await getChatConversationList();
  // 设置选中的对话
  if (activeId.value) {
    activeConversationId.value = activeId.value;
  }
});

defineExpose({ getChatConversationList });
</script>

<template>
  <ElAside
    class="bg-card relative flex h-full flex-col overflow-hidden border-r border-gray-200"
    width="280px"
  >
    <Drawer />
    <!-- 头部 -->
    <div class="flex flex-col p-4">
      <div class="mb-4 flex flex-row items-center justify-between">
        <div class="text-lg font-bold">对话</div>
        <div class="flex flex-row">
          <ElButton
            class="flex items-center bg-transparent px-1.5 hover:bg-gray-100"
            text
            @click="handleConversationCreate"
          >
            <IconifyIcon icon="lucide:plus" />
          </ElButton>
          <ElButton
            class="flex items-center bg-transparent px-1.5 hover:bg-gray-100"
            text
            @click="handleConversationClear"
          >
            <IconifyIcon icon="lucide:trash" />
          </ElButton>
          <ElButton
            class="flex items-center bg-transparent px-1.5 hover:bg-gray-100"
            text
            @click="handleRoleRepositoryOpen"
          >
            <IconifyIcon icon="lucide:user" />
          </ElButton>
        </div>
      </div>
      <ElInput
        v-model="searchName"
        placeholder="搜索对话"
        @keyup.enter="searchConversation"
      >
        <template #suffix>
          <IconifyIcon icon="lucide:search" />
        </template>
      </ElInput>
    </div>

    <!-- 对话列表 -->
    <div class="flex-1 overflow-y-auto px-4">
      <div v-if="loading" class="flex h-full items-center justify-center">
        <div class="text-sm text-gray-400">加载中...</div>
      </div>
      <div v-else-if="Object.keys(conversationMap).length === 0">
        <ElEmpty description="暂无对话" />
      </div>
      <div v-else>
        <div
          v-for="(conversations, groupName) in conversationMap"
          :key="groupName"
        >
          <div
            v-if="conversations.length > 0"
            class="mb-2 mt-4 text-xs text-gray-400"
          >
            {{ groupName }}
          </div>
          <div
            v-for="conversation in conversations"
            :key="conversation.id"
            class="group relative mb-2 cursor-pointer rounded-lg p-2 transition-all hover:bg-gray-100"
            :class="{
              'bg-gray-100': activeConversationId === conversation.id,
            }"
            @click="handleConversationClick(conversation.id)"
            @mouseenter="hoverConversationId = conversation.id"
            @mouseleave="hoverConversationId = null"
          >
            <div class="flex items-center">
              <ElAvatar
                v-if="conversation.roleAvatar"
                :src="conversation.roleAvatar"
                :size="28"
              />
              <SvgGptIcon v-else class="size-7" />
              <div class="ml-2 flex-1 overflow-hidden">
                <div class="truncate text-sm font-medium">
                  {{ conversation.title }}
                </div>
              </div>
              <div
                v-if="hoverConversationId === conversation.id"
                class="flex flex-row"
              >
                <ElButton
                  class="flex items-center bg-transparent px-1.5 hover:bg-gray-100"
                  text
                  @click.stop="handleConversationPin(conversation)"
                >
                  <IconifyIcon
                    :icon="
                      conversation.pinned ? 'lucide:pin-off' : 'lucide:pin'
                    "
                  />
                </ElButton>
                <ElButton
                  class="flex items-center bg-transparent px-1.5 hover:bg-gray-100"
                  text
                  @click.stop="handleConversationEdit(conversation)"
                >
                  <IconifyIcon icon="lucide:edit" />
                </ElButton>
                <ElButton
                  class="flex items-center bg-transparent px-1.5 hover:bg-gray-100"
                  text
                  @click.stop="handleConversationDelete(conversation.id)"
                >
                  <IconifyIcon icon="lucide:trash" />
                </ElButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ElAside>
</template>
