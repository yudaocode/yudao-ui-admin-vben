<script lang="ts" setup>
import type { ContactTemplateApi } from '#/views/mpr/contactTemplate/data';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { TabPane, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getAssistantContactTemplateList } from '#/api/mpr/contactTemplate';
import {
  getTemplateTabs,
  groupTemplateByType,
  useFormSchema,
} from '#/views/mpr/contactTemplate/data';

defineOptions({
  name: 'MessageTemplateFormModel',
});

const emit = defineEmits(['success']);
const activeTab = ref('common');
const templateTabs = ref(getTemplateTabs());

const assistantId = ref();
const formData = ref<ContactTemplateApi.ContactTemplate[]>([]);
// 使用计算属性，当 formData 变化时自动更新
const templateByType = computed(() => {
  return groupTemplateByType(formData.value);
});

function getTemplateByType(typeValue: string) {
  // 确保 formData.value 是数组
  if (!Array.isArray(formData.value)) {
    formData.value = [];
  }

  if (!templateByType.value[typeValue]) {
    const newTemplate: ContactTemplateApi.ContactTemplate = {
      assistantId: assistantId.value,
      type: typeValue,
      title: '',
      content: '',
      isTellTime: 0,
      yourTime: '',
      isTellLocation: 0,
      yourLocation: '',
      remark: '',
    };

    // 安全地添加数据
    formData.value = [...formData.value, newTemplate];
  }

  return templateByType.value[typeValue];
}

const [Form, formApi] = useVbenForm({
  handleSubmit: onSubmit,
  commonConfig: {
    componentProps: {
      // class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  schema: useFormSchema(true),
  showDefaultActions: false,
});

function resetForm() {
  activeTab.value = 'common';
  formData.value = [];
}
const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmitForm();
    // modalApi.close();
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetForm();
      return;
    }
    // 加载数据
    let data = modalApi.getData<Record<string, any>>();
    if (!data) {
      return;
    }
    if (data.assistantId) {
      assistantId.value = data.assistantId;
      modalApi.lock();
      try {
        data = await getAssistantContactTemplateList(data.assistantId);
        formData.value = data;
      } finally {
        modalApi.unlock();
      }
    }
    await onTabChange(activeTab.value);
  },
  title: '自定义消息模版',
});
async function onSubmit(_values: Record<string, any>) {
  await updateFormDataWithFormValues(await formApi.getValues());
  modalApi.lock();
  modalApi.close();
  emit('success', formData.value);
}

/** Tab切换 */
async function onTabChange(tabName: string) {
  const data =
    (await formApi.getValues()) as ContactTemplateApi.ContactTemplate;
  await updateFormDataWithFormValues(data);
  activeTab.value = tabName;
  // 设置状态查询参数
  await formApi.resetForm();
  await formApi.setValues(getTemplateByType(tabName)); // { ...formValues, type,assistantId }
}

function updateFormDataWithFormValues(formValues) {
  if (!formValues) {
    return;
  }
  const currentTemplates = Array.isArray(formData.value) ? formData.value : [];
  const typeValue = formValues.type;
  if (!typeValue) {
    return;
  }
  // 查找对应的模板
  const templateIndex = currentTemplates.findIndex(
    (item) => item.type === typeValue,
  );

  if (templateIndex === -1) {
    // 创建新模板
    const newTemplate: ContactTemplateApi.ContactTemplate = {
      assistantId: assistantId.value,
      type: typeValue,
      title: formValues.title || '',
      content: formValues.content || '',
      isTellTime: formValues.isTellTime || 0,
      yourTime: formValues.yourTime || '',
      isTellLocation: formValues.isTellLocation || 0,
      yourLocation: formValues.yourLocation || '',
      remark: formValues.remark || '',
    };
    formData.value = [...currentTemplates, newTemplate];
  } else {
    // 更新已存在的模板
    const updatedTemplates = [...currentTemplates];
    updatedTemplates[templateIndex] = {
      ...updatedTemplates[templateIndex],
      ...formValues,
      type: typeValue, // 保持 type 不变
    };
    formData.value = updatedTemplates;
  }
}
</script>
<template>
  <Modal>
    <Tabs
      v-model:active-key="activeTab"
      centered
      type="card"
      @change="onTabChange"
    >
      <TabPane v-for="tab in templateTabs" :key="tab.value" :tab="tab.label" />
    </Tabs>
    <Form />
  </Modal>
</template>
