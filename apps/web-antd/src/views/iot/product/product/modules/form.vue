<script lang="ts" setup>
import type { IotProductApi } from '#/api/iot/product/product';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Collapse, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createProduct,
  getProduct,
  updateProduct,
} from '#/api/iot/product/product';
import { $t } from '#/locales';

import { useAdvancedFormSchema, useBasicFormSchema } from '../data';

const emit = defineEmits(['success']);

/** 生成 ProductKey（包含大小写字母和数字） */
function generateProductKey(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const formData = ref<IotProductApi.Product>();
const activeKey = ref<string[]>([]);
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['产品'])
    : $t('ui.actionTitle.create', ['产品']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [AdvancedForm, advancedFormApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
  },
  layout: 'horizontal',
  schema: useAdvancedFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

/** 基础表单需要 formApi 引用，所以通过 setState 设置 schema */
formApi.setState({ schema: useBasicFormSchema(formApi, generateProductKey) });

/** 获取高级表单的值（如果表单未挂载，则从 formData 中获取） */
async function getAdvancedFormValues() {
  if (advancedFormApi.isMounted) {
    return await advancedFormApi.getValues();
  }
  // 表单未挂载（折叠状态），从 formData 中获取
  return {
    icon: formData.value?.icon,
    picUrl: formData.value?.picUrl,
    description: formData.value?.description,
  };
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 合并两个表单的值（字段不冲突，可直接合并）
    const basicValues = await formApi.getValues();
    const advancedValues = await getAdvancedFormValues();
    const data = {
      ...basicValues,
      ...advancedValues,
    } as IotProductApi.Product;
    try {
      await (formData.value?.id ? updateProduct(data) : createProduct(data));
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
      activeKey.value = [];
      return;
    }
    // 加载数据
    const data = modalApi.getData<IotProductApi.Product>();
    if (!data || !data.id) {
      // 新增：确保 Collapse 折叠，并设置默认值
      activeKey.value = [];
      await formApi.setValues({
        productKey: generateProductKey(),
      });
      return;
    }
    // 编辑：加载数据
    modalApi.lock();
    try {
      formData.value = await getProduct(data.id);
      await formApi.setValues(formData.value);
      // 如果存在高级字段数据，自动展开 Collapse
      if (
        formData.value?.icon ||
        formData.value?.picUrl ||
        formData.value?.description
      ) {
        activeKey.value = ['advanced'];
        // 等待 Collapse 展开后表单挂载
        await nextTick();
        await nextTick();
        if (advancedFormApi.isMounted) {
          await advancedFormApi.setValues(formData.value);
        }
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <div class="mx-4">
      <Form />
      <Collapse v-model:active-key="activeKey" class="mt-4">
        <Collapse.Panel key="advanced" header="更多设置">
          <AdvancedForm />
        </Collapse.Panel>
      </Collapse>
    </div>
  </Modal>
</template>
