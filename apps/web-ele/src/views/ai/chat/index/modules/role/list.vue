<script setup lang="ts">
import type { PropType } from 'vue';

import type { AiModelChatRoleApi } from '#/api/ai/model/chatRole';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  ElAvatar,
  ElButton,
  ElCard,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
} from 'element-plus';

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
async function handleMoreClick(type: string, role: any) {
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
    class="relative flex h-full flex-wrap content-start items-start overflow-auto px-6 pb-36"
    ref="tabsRef"
    @scroll="handleTabsScroll"
  >
    <div class="mb-5 mr-5 inline-block" v-for="role in roleList" :key="role.id">
      <ElCard
        class="relative rounded-lg"
        body-style="position: relative; display: flex; flex-direction: row; justify-content: flex-start; width: 240px; max-width: 240px; padding: 15px 15px 10px;"
      >
        <!-- 更多操作 -->
        <div v-if="showMore" class="absolute right-2 top-0">
          <ElDropdown>
            <ElButton link>
              <IconifyIcon icon="lucide:ellipsis-vertical" />
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem @click="handleMoreClick('edit', role)">
                  <div class="flex items-center">
                    <IconifyIcon icon="lucide:edit" color="#787878" />
                    <span class="text-primary">编辑</span>
                  </div>
                </ElDropdownItem>
                <ElDropdownItem @click="handleMoreClick('delete', role)">
                  <div class="flex items-center">
                    <IconifyIcon icon="lucide:trash" color="red" />
                    <span class="text-red-500">删除</span>
                  </div>
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>

        <!-- 角色信息 -->
        <div>
          <ElAvatar :src="role.avatar" class="h-10 w-10 overflow-hidden" />
        </div>

        <div class="ml-2 w-4/5">
          <div class="h-20">
            <div class="max-w-32 text-lg font-bold">
              {{ role.name }}
            </div>
            <div class="mt-2 text-sm">
              {{ role.description }}
            </div>
          </div>
          <div class="mt-1 flex flex-row-reverse">
            <ElButton type="primary" size="small" @click="handleUseClick(role)">
              使用
            </ElButton>
          </div>
        </div>
      </ElCard>
    </div>
  </div>
</template>
