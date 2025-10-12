<script lang="ts" setup>
import type { MallDeliveryExpressTemplateApi } from '#/api/mall/trade/delivery/expressTemplate';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createDeliveryExpressTemplate,
  getDeliveryExpressTemplate,
  updateDeliveryExpressTemplate,
} from '#/api/mall/trade/delivery/expressTemplate';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import ChargeItemForm from './charge-item-form.vue';
import FreeItemForm from './free-item-form.vue';

const emit = defineEmits(['success']);
const formData = ref<MallDeliveryExpressTemplateApi.ExpressTemplate>();
const chargeItemFormRef = ref<InstanceType<typeof ChargeItemForm>>();
const freeItemFormRef = ref<InstanceType<typeof FreeItemForm>>();

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['快递模板'])
    : $t('ui.actionTitle.create', ['快递模板']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 120,
  },
  wrapperClass: 'grid-cols-1',
  layout: 'vertical',
  schema: useFormSchema(),
  showDefaultActions: false,
});

/** 更新运费设置 */
const handleUpdateCharges = (charges: any[]) => {
  formData.value =
    formApi.getValues() as MallDeliveryExpressTemplateApi.ExpressTemplate;
  formData.value.charges = charges;
  formApi.setValues({
    charges,
  });
};

/** 更新包邮设置 */
const handleUpdateFrees = (frees: any[]) => {
  formData.value =
    formApi.getValues() as MallDeliveryExpressTemplateApi.ExpressTemplate;
  formData.value.frees = frees;
  formApi.setValues({
    frees,
  });
};

/** 创建或更新快递模板 */
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    // 验证子表单
    const chargeFormInstance = Array.isArray(chargeItemFormRef.value)
      ? chargeItemFormRef.value[0]
      : chargeItemFormRef.value;
    const freeFormInstance = Array.isArray(freeItemFormRef.value)
      ? freeItemFormRef.value[0]
      : freeItemFormRef.value;

    try {
      if (chargeFormInstance) {
        chargeFormInstance.validate();
      }
      if (freeFormInstance) {
        freeFormInstance.validate();
      }
    } catch (error: any) {
      message.error(error.message || '子表单验证失败');
      return;
    }

    modalApi.lock();
    // 提交表单
    const data = cloneDeep(
      await formApi.getValues(),
    ) as MallDeliveryExpressTemplateApi.ExpressTemplate;
    try {
      // 前端价格以元展示，提交到后端用分计算
      data.charges?.forEach((item: any) => {
        item.startPrice = Math.round(item.startPrice * 100);
        item.extraPrice = Math.round(item.extraPrice * 100);
      });
      data.frees?.forEach((item: any) => {
        item.freePrice = Math.round(item.freePrice * 100);
      });

      await (formData.value?.id
        ? updateDeliveryExpressTemplate(data)
        : createDeliveryExpressTemplate(data));

      // 关闭并提示
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
    // 加载数据
    const data =
      modalApi.getData<MallDeliveryExpressTemplateApi.ExpressTemplate>();
    if (!data || !data.id) {
      resetFormData();
      await formApi.setValues(formData.value);
    } else {
      await loadFormData(data.id);
    }
  },
});

// 重置表单数据
function resetFormData() {
  formData.value = {
    id: undefined,
    name: '',
    chargeMode: 1,
    sort: 0,
    charges: [],
    frees: [],
  };
}

// 加载表单数据
async function loadFormData(id: number) {
  modalApi.lock();
  try {
    const data = await getDeliveryExpressTemplate(id);
    formData.value = data;

    // 前端价格以元展示
    formData.value.charges?.forEach((item: any, index: number) => {
      item.seq = item.seq || Date.now() + index;
      item.startPrice = item.startPrice / 100;
      item.extraPrice = item.extraPrice / 100;
    });
    formData.value.frees?.forEach((item: any, index: number) => {
      item.seq = item.seq || Date.now() + index;
      item.freePrice = item.freePrice / 100;
    });

    // 设置到 values
    await formApi.setValues(formData.value);
  } finally {
    modalApi.unlock();
  }
}
</script>

<template>
  <Modal class="w-[80%]" :title="getTitle">
    <Form class="mx-3">
      <template #charges>
        <ChargeItemForm
          ref="chargeItemFormRef"
          :items="formData?.charges ?? []"
          :charge-mode="formData?.chargeMode ?? 1"
          @update:items="handleUpdateCharges"
        />
      </template>
      <template #frees>
        <FreeItemForm
          ref="freeItemFormRef"
          :items="formData?.frees ?? []"
          :charge-mode="formData?.chargeMode ?? 1"
          @update:items="handleUpdateFrees"
        />
      </template>
    </Form>
  </Modal>
</template>
