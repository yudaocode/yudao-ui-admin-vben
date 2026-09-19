<script lang="ts" setup>
import type { OaMailProviderApi } from '#/api/oa/mail/provider';

import { computed, onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

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
  <ElSelect
    v-model="selectValue"
    :disabled="disabled"
    :clearable="clearable"
    placeholder="请选择邮箱服务"
    filterable
    class="w-full"
  >
    <ElOption
      v-for="item in list"
      :key="item.id"
      :label="item.name"
      :value="item.id!"
    />
  </ElSelect>
</template>
