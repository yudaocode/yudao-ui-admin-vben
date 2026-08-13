<script lang="ts" setup>
import type { FmsVoucherTemplateCategoryApi } from '#/api/fms/config/voucher-template-category';

import { computed, ref } from 'vue';

import { ElButton, ElOption, ElSelect } from 'element-plus';

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
const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <div class="flex w-full gap-2">
    <ElSelect
      v-model="selectValue"
      class="flex-1"
      :disabled="disabled"
      :placeholder="placeholder"
    >
      <ElOption
        v-for="item in categories"
        :key="item.id"
        :label="item.name"
        :value="item.id!"
      />
    </ElSelect>
    <ElButton :disabled="disabled" @click="categoryManageRef?.open()">
      管理分类
    </ElButton>
  </div>
  <CategoryManage
    ref="categoryManageRef"
    :account-set-id="accountSetId"
    @change="emit('change', $event)"
    @select="emit('update:modelValue', $event)"
  />
</template>
