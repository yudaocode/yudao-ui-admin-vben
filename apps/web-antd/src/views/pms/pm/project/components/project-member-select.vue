<script lang="ts" setup>
import type { PmsProjectMemberApi } from '#/api/pms/pm/project/member';

import { ref, watch } from 'vue';

import { Select } from 'ant-design-vue';

import { getProjectMemberList } from '#/api/pms/pm/project/member';

defineOptions({ name: 'PmsProjectMemberSelect' });

// TODO @AI：对齐 system/user/components/select.vue：modelValue、禁用、清空、回显；三端 props 和清空行为保持一致。

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[];
    multiple?: boolean;
    placeholder?: string;
    projectId: number;
  }>(),
  { modelValue: undefined, multiple: false, placeholder: '请选择项目成员' },
);

const emit = defineEmits(['update:modelValue', 'loaded']);

const loading = ref(false); // 选项加载中
const memberList = ref<PmsProjectMemberApi.ProjectMember[]>([]); // 项目成员选项

/** 查询项目成员选项 */
async function getMemberList() {
  loading.value = true;
  try {
    memberList.value = await getProjectMemberList(props.projectId);
    emit('loaded', memberList.value);
  } finally {
    loading.value = false;
  }
}

watch(() => props.projectId, getMemberList, { immediate: true });
</script>

<template>
  <Select
    :allow-clear="true"
    :loading="loading"
    :max-tag-count="multiple ? 'responsive' : undefined"
    :mode="multiple ? 'multiple' : undefined"
    :options="
      memberList.map((member) => ({
        label: member.nickname,
        value: member.userId,
      }))
    "
    :placeholder="placeholder"
    :value="modelValue"
    class="w-full"
    option-filter-prop="label"
    show-search
    @update:value="emit('update:modelValue', $event)"
  />
</template>
