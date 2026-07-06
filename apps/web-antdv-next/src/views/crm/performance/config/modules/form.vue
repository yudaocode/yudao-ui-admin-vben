<script lang="ts" setup>
import type { CrmPerformanceConfigApi } from '#/api/crm/performance/config';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createPerformanceConfig,
  getPerformanceConfig,
  PerformanceConfigObjectTypeEnum,
  updatePerformanceConfig,
} from '#/api/crm/performance/config';
import { BizTypeEnum } from '#/api/crm/permission';
import { $t } from '#/locales';

import { monthFields, useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<CrmPerformanceConfigApi.PerformanceConfig>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['业绩目标'])
    : $t('ui.actionTitle.create', ['业绩目标']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data = buildSubmitData(await formApi.getValues());
    if (!data.objectId) {
      message.warning('请选择目标对象');
      modalApi.unlock();
      return;
    }
    try {
      await (data.id
        ? updatePerformanceConfig(data)
        : createPerformanceConfig(data));
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    await formApi.resetForm();
    const data =
      modalApi.getData<CrmPerformanceConfigApi.PerformanceConfig>();
    if (!data?.id) {
      await formApi.setValues(buildFormValues());
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getPerformanceConfig(data.id);
      await formApi.setValues(buildFormValues(formData.value));
    } finally {
      modalApi.unlock();
    }
  },
});

/** 构建表单默认值 */
function buildFormValues(data?: CrmPerformanceConfigApi.PerformanceConfig) {
  const formValues: any = {
    objectId: undefined,
    objectType: PerformanceConfigObjectTypeEnum.DEPT,
    year: new Date().getFullYear().toString(),
    bizType: BizTypeEnum.CRM_CONTRACT,
    ...Object.fromEntries(monthFields.map((item) => [item.prop, 0])),
    ...data,
  };
  formValues.year = String(formValues.year);
  if (formValues.objectType === PerformanceConfigObjectTypeEnum.USER) {
    formValues.userObjectId = formValues.objectId;
  } else {
    formValues.deptObjectId = formValues.objectId;
  }
  return formValues;
}

/** 构建提交数据 */
function buildSubmitData(values: Record<string, any>) {
  const data = { ...values } as CrmPerformanceConfigApi.PerformanceConfig & {
    deptObjectId?: number;
    userObjectId?: number;
  };
  data.objectId =
    data.objectType === PerformanceConfigObjectTypeEnum.DEPT
      ? data.deptObjectId!
      : data.userObjectId!;
  data.year = Number(data.year);
  monthFields.forEach((item) => {
    data[item.prop] = Number(data[item.prop] || 0);
  });
  delete data.deptObjectId;
  delete data.userObjectId;
  return data;
}
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
  </Modal>
</template>
