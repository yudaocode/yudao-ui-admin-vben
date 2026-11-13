<script setup lang="ts">
import type { PropType } from 'vue';

import type { AiModelChatRoleApi } from '#/api/ai/model/chatRole';
import type { AiSkillApi } from '#/api/ai/skill';

import { onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Avatar, Button, Card, Dropdown, Menu, Tooltip } from 'ant-design-vue';

import { getSkillSimpleList } from '#/api/ai/skill';

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
const skillList = ref<AiSkillApi.Skill[]>([]); // 技能列表：只包含启用的技能

/** 获得角色引用的技能 */
function getRoleSkills(role: AiModelChatRoleApi.ChatRole) {
  return skillList.value.filter((skill) => role.skillIds?.includes(skill.id!));
}

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

/** 初始化 */
onMounted(async () => {
  skillList.value = await getSkillSimpleList();
});
</script>

<template>
  <div
    class="relative grid h-full grid-cols-1 content-start items-start gap-3 overflow-auto pb-36 pr-3 lg:grid-cols-2"
    ref="tabsRef"
    @scroll="handleTabsScroll"
  >
    <div class="min-w-0" v-for="role in roleList" :key="role.id">
      <Card
        class="relative rounded-lg"
        :body-style="{
          position: 'relative',
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
            />
            <div class="ml-2 truncate text-base font-medium" :title="role.name">
              {{ role.name }}
            </div>
          </div>
        </div>
        <!-- 描述信息 -->
        <div
          class="mt-2 line-clamp-2 h-10 overflow-hidden break-all text-sm text-gray-600"
          :title="role.description"
        >
          {{ role.description }}
        </div>
        <!-- 引用的技能 -->
        <div
          v-if="getRoleSkills(role).length"
          class="mt-2 flex flex-wrap gap-1"
        >
          <Tooltip
            v-for="skill in getRoleSkills(role)"
            :key="skill.id"
            :title="`${skill.name}：${skill.description}`"
          >
            <span
              class="max-w-full truncate rounded bg-gray-100 px-1.5 text-xs leading-5 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              {{ skill.name }}
            </span>
          </Tooltip>
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
