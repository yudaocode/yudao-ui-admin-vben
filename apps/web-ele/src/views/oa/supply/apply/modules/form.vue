<script lang="ts" setup>
import type { OaSupplyApplyApi } from '#/api/oa/supply/apply';
import type { OaSupplyIssueApi } from '#/api/oa/supply/issue';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDate } from '@vben/utils';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createSupplyApply,
  getSupplyApply,
  updateSupplyApply,
} from '#/api/oa/supply/apply';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import ItemForm from './item-form.vue';

const emit = defineEmits(['success']);
const formData = ref<OaSupplyApplyApi.SupplyApply>();
const itemFormRef = ref<InstanceType<typeof ItemForm>>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['领用申请'])
    : $t('ui.actionTitle.create', ['领用申请']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

/** 更新领用明细 */
function handleUpdateItems(items: OaSupplyIssueApi.SupplyApplyItem[]) {
  if (formData.value) {
    formData.value.items = items;
  }
  formApi.setValues({ items });
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 校验领用明细
    const itemFormInstance = Array.isArray(itemFormRef.value)
      ? itemFormRef.value[0]
      : itemFormRef.value;
    try {
      itemFormInstance?.validate();
    } catch (error: any) {
      ElMessage.warning(error.message || '请检查领用明细');
      return;
    }

    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as OaSupplyApplyApi.SupplyApply;
    try {
      await (formData.value?.id
        ? updateSupplyApply(data)
        : createSupplyApply(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as null | OaSupplyApplyApi.SupplyApply;
    if (!data || !data.id) {
      // 新增时，默认领用日期为当天
      formData.value = { fileUrls: [], items: [] };
      await formApi.setValues({
        applyTime: formatDate(new Date(), 'YYYY-MM-DD 00:00:00'),
        items: [],
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSupplyApply(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/3">
    <Form class="mx-4">
      <template #items>
        <ItemForm
          ref="itemFormRef"
          :items="formData?.items ?? []"
          @update:items="handleUpdateItems"
        />
      </template>
    </Form>
  </Modal>
</template>
