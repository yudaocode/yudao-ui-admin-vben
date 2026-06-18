<script lang="ts" setup>
import type { ImManagerChannelApi } from '#/api/im/manager/channel';

import { computed, onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getSimpleChannelList } from '#/api/im/manager/channel';

defineOptions({ name: 'ImManagerChannelSelect' });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean
    disabled?: boolean
    modelValue?: number
    placeholder?: string
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择频道',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const loading = ref(false);
const channelList = ref<ImManagerChannelApi.Channel[]>([]);

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const options = computed(() =>
  channelList.value.map((item) => ({ label: item.name, value: item.id })),
);

/** 加载频道列表 */
async function loadChannelList() {
  loading.value = true;
  try {
    channelList.value = await getSimpleChannelList();
  } finally {
    loading.value = false;
  }
}

onMounted(loadChannelList);
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
  />
</template>
