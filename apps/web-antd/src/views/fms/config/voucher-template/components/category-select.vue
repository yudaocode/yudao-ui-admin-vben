<script lang="ts" setup>
import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { computed, ref } from 'vue';

import { Button, Select } from 'ant-design-vue';

import CategoryManage from './category-manage.vue';

defineOptions({ name: 'FmsVoucherTemplateCategorySelect' });

const props = withDefaults(
  defineProps<{
    accountSetId?: number;
    categories: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory[];
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    accountSetId: undefined,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择模板分类',
  },
);

const emit = defineEmits<{
  change: [categories: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory[]];
  'update:modelValue': [value: number | undefined];
}>();

const categoryManageRef = ref<InstanceType<typeof CategoryManage>>();
const categoryOptions = computed(() =>
  props.categories.map((item) => ({ label: item.name, value: item.id! })),
);
const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <div class="flex w-full gap-2">
    <Select
      v-model:value="selectValue"
      allow-clear
      class="flex-1"
      :disabled="disabled"
      :options="categoryOptions"
      :placeholder="placeholder"
    />
    <Button :disabled="disabled" @click="categoryManageRef?.open()">
      管理分类
    </Button>
  </div>
  <CategoryManage
    ref="categoryManageRef"
    :account-set-id="accountSetId"
    @change="emit('change', $event)"
    @select="emit('update:modelValue', $event)"
  />
</template>
