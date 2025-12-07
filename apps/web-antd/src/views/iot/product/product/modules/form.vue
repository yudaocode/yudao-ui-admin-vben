<script lang="ts" setup>
import type { IotProductApi } from '#/api/iot/product/product';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Collapse, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createProduct,
  getProduct,
  updateProduct,
} from '#/api/iot/product/product';
import { $t } from '#/locales';

import {
  generateProductKey,
  useAdvancedFormSchema,
  useBasicFormSchema,
} from '../data';

const emit = defineEmits(['success']);
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
  wrapperClass: 'grid-cols-2',
});

// TODO @haohao：这个要不还是一行一个？这样样式好看点哈。
const [AdvancedForm, advancedFormApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
  },
  layout: 'horizontal',
  schema: useAdvancedFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

/** 基础表单需要 formApi 引用，所以通过 setState 设置 schema */
// TODO haohao：@haohao：要不要把 generateProductKey 拿到这个 vue 里，作为参数传递到 useBasicFormSchema 里？
formApi.setState({ schema: useBasicFormSchema(formApi) });

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 合并两个表单的值
    const basicValues = await formApi.getValues();
    // TODO @haohao：有 linter 修复下；“formData.value?.id”；另外，这里直接两个表单合并，是不是就可以了呀？因为 2 个 schema 本身不同，字段就不同，不会冲突。
    const advancedValues = activeKey.value.includes('advanced')
      ? await advancedFormApi.getValues()
      : formData.value?.id
        ? {
            icon: formData.value.icon,
            picUrl: formData.value.picUrl,
            description: formData.value.description,
          }
        : {};
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
      // 新增：设置默认值
      // TODO @AI：
      await formApi.setValues({
        // TODO @haohao：要不要把 generateProductKey 拿到这个 vue 里，作为参数传递到 useBasicFormSchema 里？
        productKey: generateProductKey(),
        status: 0, // TODO @haohao：通过 defaultValue 即可；
      });
      return;
    }
    // 编辑：加载数据
    modalApi.lock();
    try {
      formData.value = await getProduct(data.id);
      await formApi.setValues(formData.value);
      // 设置高级表单（不等待）
      // TODO @haohao：直接把 formData 传过去？没关系的哈。因为会 filter 掉不存在的值，可以试试哈。
      // TODO @haohao：这里是不是要 await 下呀？有黄色的告警；
      advancedFormApi.setValues({
        icon: formData.value.icon,
        picUrl: formData.value.picUrl,
        description: formData.value.description,
      });
      // 有高级字段时自动展开
      // TODO @haohao：默认不用展开哈。
      if (
        formData.value.icon ||
        formData.value.picUrl ||
        formData.value.description
      ) {
        activeKey.value = ['advanced'];
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
