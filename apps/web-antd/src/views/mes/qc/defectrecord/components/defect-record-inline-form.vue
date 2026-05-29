<script lang="ts" setup>
import type { MesQcDefectRecordApi } from '#/api/mes/qc/defectrecord';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createDefectRecord,
  getDefectRecord,
  updateDefectRecord,
} from '#/api/mes/qc/defectrecord';
import { $t } from '#/locales';

interface OpenData {
  formType: 'create' | 'update';
  id?: number;
  lineId: number;
  qcId: number;
  qcType: number;
}

defineOptions({ name: 'DefectRecordInlineForm' });

const emit = defineEmits(['success']);
// TODO @AI：这里，别的模块，一般是要枚举 create、update 么？
const formType = ref<'create' | 'update'>('create');
const formData = ref<MesQcDefectRecordApi.DefectRecord>();

const getTitle = computed(() =>
  formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['缺陷记录'])
    : $t('ui.actionTitle.create', ['缺陷记录']),
);

// TODO @AI：搞个 data.ts？
// TODO @AI：代码风格，貌似不够一致；
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'name',
      label: '缺陷描述',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入缺陷描述',
        rows: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'level',
      label: '缺陷等级',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_DEFECT_LEVEL, 'number'),
        placeholder: '请选择缺陷等级',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '缺陷数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 1,
        placeholder: '请输入缺陷数量',
      },
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ],
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
    try {
      const values =
        (await formApi.getValues()) as MesQcDefectRecordApi.DefectRecord;
      const payload: MesQcDefectRecordApi.DefectRecord = {
        ...values,
        lineId: formData.value.lineId,
        qcId: formData.value.qcId,
        qcType: formData.value.qcType,
      };
      if (formType.value === 'update') {
        await updateDefectRecord({ ...payload, id: formData.value.id });
        message.success($t('common.updateSuccess'));
      } else {
        await createDefectRecord(payload);
        message.success($t('common.createSuccess'));
      }
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
    const data = modalApi.getData<OpenData>();
    formType.value = data.formType;
    if (data.id) {
      // 编辑：根据 id 加载明细
      modalApi.lock();
      try {
        formData.value = await getDefectRecord(data.id);
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    } else {
      // 新增：保留来自父级的上下文，并默认数量为 1
      formData.value = {
        lineId: data.lineId,
        qcId: data.qcId,
        qcType: data.qcType,
      };
      await formApi.setValues({ quantity: 1 });
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <Form class="mx-4" />
  </Modal>
</template>
