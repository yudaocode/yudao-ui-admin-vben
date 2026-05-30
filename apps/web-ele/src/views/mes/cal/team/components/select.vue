<script lang="ts" setup>
import type { MesCalTeamApi } from '#/api/mes/cal/team';

import { onMounted, ref } from 'vue';

import { ElButton, ElOption, ElSelect } from 'element-plus';

import { getTeamList } from '#/api/mes/cal/team';

import CalTeamSelectDialog from './select-dialog.vue';

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择班组',
  },
);
const emit = defineEmits<{
  change: [row?: MesCalTeamApi.Team];
  'update:modelValue': [value?: number];
}>();
const teamList = ref<MesCalTeamApi.Team[]>([]); // 班组选项
const dialogRef = ref<InstanceType<typeof CalTeamSelectDialog>>(); // 班组选择弹窗

/** 加载班组选项 */
async function loadTeamList() {
  teamList.value = await getTeamList();
}

/** 处理下拉选择变化 */
function handleChange(value: number | string | undefined) {
  const teamId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', teamId);
  emit(
    'change',
    teamList.value.find((item) => item.id === teamId),
  );
}

/** 打开班组选择弹窗 */
function openDialog() {
  if (props.disabled) {
    return;
  }
  dialogRef.value?.open(props.modelValue ? [props.modelValue] : [], { multiple: false });
}

/** 处理弹窗选择 */
function handleSelected(rows: MesCalTeamApi.Team[]) {
  const row = rows[0];
  emit('update:modelValue', row?.id);
  emit('change', row);
}

onMounted(loadTeamList);
</script>

<template>
  <div class="flex w-full gap-2">
    <ElSelect
      :clearable="clearable"
      :disabled="disabled"
      :model-value="modelValue"
      :placeholder="placeholder"
      class="flex-1"
      @change="handleChange"
    >
      <ElOption v-for="item in teamList" :key="item.id" :label="item.name" :value="item.id!" />
    </ElSelect>
    <ElButton :disabled="disabled" @click="openDialog">选择</ElButton>
    <CalTeamSelectDialog ref="dialogRef" :multiple="false" @selected="handleSelected" />
  </div>
</template>
