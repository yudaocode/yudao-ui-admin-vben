<script lang="ts" setup>
import type { FormType } from './data';

import type { MesQcDefectRecordApi } from '#/api/mes/qc/defectrecord';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createDefectRecord,
  getDefectRecord,
  updateDefectRecord,
} from '#/api/mes/qc/defectrecord';
import { $t } from '#/locales';

import { useDefectRecordInlineFormSchema } from './data';

interface CtxData {
  formType: FormType;
  id?: number;
  lineId: number;
  qcId: number;
  qcType: number;
}

defineOptions({ name: 'DefectRecordInlineForm' });

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesQcDefectRecordApi.DefectRecord>();

const getTitle = computed(() =>
  formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['缺陷记录'])
    : $t('ui.actionTitle.create', ['缺陷记录']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: useDefectRecordInlineFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.value) {
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const values =
      (await formApi.getValues()) as MesQcDefectRecordApi.DefectRecord;
    const payload: MesQcDefectRecordApi.DefectRecord = {
      ...values,
      lineId: formData.value.lineId,
      qcId: formData.value.qcId,
      qcType: formData.value.qcType,
    };
    try {
      if (formType.value === 'update') {
        await updateDefectRecord({ ...payload, id: formData.value.id });
        message.success($t('common.updateSuccess'));
      } else {
        await createDefectRecord(payload);
        message.success($t('common.createSuccess'));
      }
      // 关闭并提示
      await modalApi.close();
      emit('success');
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
    const data = modalApi.getData<CtxData>();
    formType.value = data.formType;
    if (!data.id) {
      // 新增：保留来自父级的上下文，并默认数量为 1
      formData.value = {
        lineId: data.lineId,
        qcId: data.qcId,
        qcType: data.qcType,
      };
      await formApi.setValues({ quantity: 1 });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getDefectRecord(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <Form class="mx-4" />
  </Modal>
</template>
