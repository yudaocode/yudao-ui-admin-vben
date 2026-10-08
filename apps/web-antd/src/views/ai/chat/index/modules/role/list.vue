<script setup lang="ts">
import type { PropType } from 'vue';

import type { AiModelChatRoleApi } from '#/api/ai/model/chatRole';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Avatar, Button, Card, Dropdown, Empty, Menu } from 'ant-design-vue';

const props = defineProps({
  loading: {
    type: Boolean,
    required: true,
  },
  roleList: {
    type: Array as PropType<AiModelChatRoleApi.ChatRole[]>,
    required: true,
  },
  showMore: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emits = defineEmits(['onDelete', 'onEdit', 'onUse', 'onPage']);

const tabsRef = ref<any>();

/** 操作：编辑、删除 */
async function handleMoreClick(data: any) {
  const type = data[0];
  const role = data[1];
  if (type === 'delete') {
    emits('onDelete', role);
  } else {
    emits('onEdit', role);
  }
}

/** 选中 */
function handleUseClick(role: any) {
  emits('onUse', role);
}

/** 滚动 */
async function handleTabsScroll() {
  if (tabsRef.value) {
    const { scrollTop, scrollHeight, clientHeight } = tabsRef.value;
    if (scrollTop + clientHeight >= scrollHeight - 20 && !props.loading) {
      emits('onPage');
    }
  }
}
</script>

<template>
  <div
    ref="tabsRef"
    class="relative h-full min-h-0 overflow-auto"
    @scroll="handleTabsScroll"
  >
    <Empty
      v-if="!loading && roleList.length === 0"
      class="mt-16"
      description="暂无角色"
    />
    <div v-else class="flex flex-wrap content-start items-start gap-3 pb-8">
      <Card
        v-for="role in roleList"
        :key="role.id"
        class="w-60 rounded-lg"
        :body-style="{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '15px',
        }"
      >
        <!-- 头部：头像、名称 -->
        <div class="flex items-center justify-between">
          <div class="flex min-w-0 flex-1 items-center">
            <Avatar
              :src="role.avatar"
              class="h-8 w-8 flex-shrink-0 overflow-hidden"
            >
              {{ role.name?.slice(0, 2) }}
            </Avatar>
            <div class="ml-2 truncate text-base font-medium">
              {{ role.name }}
            </div>
          </div>
        </div>
        <!-- 描述信息 -->
        <div
          class="mt-2 line-clamp-2 h-10 overflow-hidden text-sm text-gray-600"
        >
          {{ role.description }}
        </div>
        <!-- 底部操作按钮 -->
        <div class="mt-2 flex items-center justify-end gap-2">
          <Dropdown v-if="showMore">
            <Button size="small">
              <IconifyIcon icon="lucide:ellipsis" />
            </Button>
            <template #overlay>
              <Menu>
                <Menu.Item @click="handleMoreClick(['delete', role])">
                  <div class="flex items-center">
                    <IconifyIcon icon="lucide:trash" color="red" />
                    <span class="ml-2 text-red-500">删除</span>
                  </div>
                </Menu.Item>
                <Menu.Item @click="handleMoreClick(['edit', role])">
                  <div class="flex items-center">
                    <IconifyIcon icon="lucide:edit" color="#787878" />
                    <span class="ml-2 text-primary">编辑</span>
                  </div>
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>
          <Button type="primary" size="small" @click="handleUseClick(role)">
            使用
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>
