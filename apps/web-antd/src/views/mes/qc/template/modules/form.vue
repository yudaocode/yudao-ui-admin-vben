<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesQcTemplateApi } from '#/api/mes/qc/template';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createTemplate,
  getTemplate,
  updateTemplate,
} from '#/api/mes/qc/template';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import IndicatorList from './indicator-list.vue';
import ItemList from './item-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create'); // 弹窗形态：新增/编辑/详情
const subTabsName = ref('indicator'); // 当前激活的子表 tab
const formData = ref<MesQcTemplateApi.Template>();

const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['质检方案']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['质检方案'])
    : $t('ui.actionTitle.create', ['质检方案']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  wrapperClass: 'grid-cols-3',
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (formType.value === 'detail') {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesQcTemplateApi.Template;
    try {
      await (formData.value?.id ? updateTemplate(data) : createTemplate(data));
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
    formApi.setState({ schema: useFormSchema(formApi) });
    subTabsName.value = 'indicator';
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getTemplate(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-4/5">
    <Form class="mx-4" />
    <Tabs
      v-if="formType !== 'create' && formData?.id"
      v-model:active-key="subTabsName"
      class="mx-4 mt-4"
    >
      <Tabs.TabPane key="indicator" tab="检测指标项">
        <IndicatorList
          :readonly="formType === 'detail'"
          :template-id="formData.id"
        />
      </Tabs.TabPane>
      <Tabs.TabPane key="item" tab="产品关联">
        <ItemList
          :readonly="formType === 'detail'"
          :template-id="formData.id"
        />
      </Tabs.TabPane>
    </Tabs>
  </Modal>
</template>
