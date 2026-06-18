<script lang="ts" setup>
import type { ImManagerGroupApi } from '#/api/im/manager/group';

import { computed, onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getManagerGroupPage } from '#/api/im/manager/group';

defineOptions({ name: 'ImManagerGroupSelect' });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择群',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const loading = ref(false);
const groupList = ref<ImManagerGroupApi.Group[]>([]);

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const options = computed(() =>
  groupList.value.map((item) => ({
    label: `${item.name} (${item.id})`,
    value: item.id,
  })),
);

/** 加载群列表 */
async function loadGroupList() {
  loading.value = true;
  try {
    const data = await getManagerGroupPage({
      pageNo: 1,
      pageSize: 100,
    });
    groupList.value = data.list || [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadGroupList);
</script>

<template>
  <Select
    v-model:value="value"
    :allow-clear="allowClear"
    :disabled="disabled"
    :loading="loading"
    :options="options"
    :placeholder="placeholder"
    class="w-full"
    show-search
  />
</template>
