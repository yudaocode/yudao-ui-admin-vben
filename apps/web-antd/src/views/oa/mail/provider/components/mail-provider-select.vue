<script lang="ts" setup>
import type { OaMailProviderApi } from '#/api/oa/mail/provider';

import { computed, onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getSimpleMailProviderList } from '#/api/oa/mail/provider';

/** 邮箱服务选择 */
defineOptions({ name: 'OaMailProviderSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
  }>(),
  { disabled: false, clearable: true, modelValue: undefined },
);
const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const list = ref<OaMailProviderApi.MailProvider[]>([]); // 启用的邮箱服务配置
const options = computed(() =>
  list.value.map((item) => ({ label: item.name, value: item.id! })),
);
const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

/** 初始化 */
onMounted(async () => {
  list.value = await getSimpleMailProviderList();
});
</script>

<template>
  <Select
    v-model:value="selectValue"
    :options="options"
    :disabled="disabled"
    :allow-clear="clearable"
    placeholder="请选择邮箱服务"
    show-search
    option-filter-prop="label"
    class="w-full"
  />
</template>
