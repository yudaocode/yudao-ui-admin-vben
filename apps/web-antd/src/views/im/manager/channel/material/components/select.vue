<script lang="ts" setup>
import type { ImManagerChannelMaterialApi } from '#/api/im/manager/channel/material';

import { computed, ref, watch } from 'vue';

import { Select } from 'ant-design-vue';

import { getSimpleManagerChannelMaterialList } from '#/api/im/manager/channel/material';

defineOptions({ name: 'ImManagerMaterialSelect' });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    channelId?: number;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    channelId: undefined,
    modelValue: undefined,
    placeholder: '请选择素材',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const loading = ref(false);
const materialList = ref<ImManagerChannelMaterialApi.Material[]>([]);

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const options = computed(() =>
  materialList.value.map((item) => ({ label: item.title, value: item.id })),
);

/** 按频道加载素材 */
async function loadMaterialList(channelId?: number) {
  emit('update:modelValue', undefined);
  materialList.value = [];
  if (!channelId) {
    return;
  }
  loading.value = true;
  try {
    materialList.value = await getSimpleManagerChannelMaterialList(channelId);
  } finally {
    loading.value = false;
  }
}

watch(() => props.channelId, loadMaterialList, { immediate: true });
</script>

<template>
  <Select
    v-model:value="value"
    :allow-clear="allowClear"
    :disabled="!channelId"
    :loading="loading"
    :options="options"
    :placeholder="placeholder"
    class="w-full"
  />
</template>
