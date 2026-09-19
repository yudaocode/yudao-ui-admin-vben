<script lang="ts" setup>
import type { OaOfficialDocSendApi } from '#/api/oa/officialdoc/send';
import type { OaOfficialDocTemplateApi } from '#/api/oa/officialdoc/template';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { formatDate } from '@vben/utils';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createOfficialDocSend,
  getOfficialDocSend,
  updateOfficialDocSend,
} from '#/api/oa/officialdoc/send';
import { getOfficialDocTemplate } from '#/api/oa/officialdoc/template';
import { $t } from '#/locales';

import OfficialDocPreview from '../../components/preview.vue';
import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const userStore = useUserStore(); // 当前用户

const formData = ref<OaOfficialDocSendApi.OfficialDocSend>(); // 表单数据
const selectedTemplate = ref<OaOfficialDocTemplateApi.OfficialDocTemplate>(); // 当前套红模板，用于文号和预览

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['公文发文'])
    : $t('ui.actionTitle.create', ['公文发文']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 110,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema({ onTemplateChange: handleTemplateChange }),
  showDefaultActions: false,
  handleValuesChange(values) {
    previewDocument.value = { ...values };
  },
});

/** 预览的公文内容，随表单实时更新 */
const previewDocument = ref<Partial<OaOfficialDocSendApi.OfficialDocSend>>({});

/** 切换套红模板：回填字号，并记录模板详情用于预览 */
async function handleTemplateChange(templateId?: number) {
  selectedTemplate.value = undefined;
  if (!templateId) {
    await formApi.setFieldValue('noPrefix', undefined);
    return;
  }
  const template = await getOfficialDocTemplate(templateId);
  // 只回填当前选中的模板，避免快速切换时旧请求覆盖新选择
  const values = await formApi.getValues();
  if (values.templateId !== templateId) {
    return;
  }
  selectedTemplate.value = template;
  await formApi.setFieldValue('noPrefix', template.noPrefix);
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = {
      ...formData.value,
      ...(await formApi.getValues()),
    } as OaOfficialDocSendApi.OfficialDocSend;
    try {
      await (formData.value?.id
        ? updateOfficialDocSend(data)
        : createOfficialDocSend(data));
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
      selectedTemplate.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as null | { id?: number };
    if (!data?.id) {
      // 新增：填充业务默认值
      await formApi.setValues({
        year: new Date().getFullYear(),
        secrecyLevel: 0,
        urgencyLevel: 0,
        disclosureType: 0,
        issueTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
        sendDeptId: userStore.userInfo?.deptId,
        mainDeptIds: [],
        copyDeptIds: [],
        fileUrls: [],
        content: '',
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getOfficialDocSend(data.id);
      await formApi.setValues(formData.value);
      if (formData.value.templateId) {
        selectedTemplate.value = await getOfficialDocTemplate(
          formData.value.templateId,
        );
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[90%]">
    <div class="mx-4 grid grid-cols-1 gap-[20px] xl:grid-cols-2">
      <Form />
      <!-- 随表单内容实时更新套红预览 -->
      <div class="min-w-0 overflow-auto">
        <OfficialDocPreview
          :document="previewDocument"
          :template="selectedTemplate"
        />
      </div>
    </div>
  </Modal>
</template>
