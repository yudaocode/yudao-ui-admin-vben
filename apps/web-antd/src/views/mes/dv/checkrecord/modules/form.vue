<script lang="ts" setup>
import type { MesDvCheckRecordApi } from '#/api/mes/dv/checkrecord';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Popconfirm } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createCheckRecord,
  getCheckRecord,
  submitCheckRecord,
  updateCheckRecord,
} from '#/api/mes/dv/checkrecord';
import { $t } from '#/locales';
import { MesDvCheckRecordStatusEnum } from '#/views/mes/utils/constants';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';

type FormMode = 'create' | 'detail' | 'update';

const emit = defineEmits(['success']);
const formMode = ref<FormMode>('create');
const formData = ref<MesDvCheckRecordApi.CheckRecord>();
const isDetail = computed(() => formMode.value === 'detail');
const canSubmit = computed(
  () => formMode.value === 'update' && formData.value?.status === MesDvCheckRecordStatusEnum.DRAFT,
);
const getTitle = computed(
  () =>
    ({ create: '新增点检记录', update: '修改点检记录', detail: '查看点检记录' })[formMode.value],
);

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
  schema: useFormSchema(),
  showDefaultActions: false,
});

/** 提交点检记录 */
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid || !formData.value?.id) {
    return;
  }

  modalApi.lock();
  try {
    await updateCheckRecord((await formApi.getValues()) as MesDvCheckRecordApi.CheckRecord);
    await submitCheckRecord(formData.value.id);
    await modalApi.close();
    emit('success');
    message.success('提交成功');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (isDetail.value) {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data = (await formApi.getValues()) as MesDvCheckRecordApi.CheckRecord;
    try {
      if (formMode.value === 'create') {
        const id = await createCheckRecord(data);
        formData.value = { ...data, id: id as number, status: MesDvCheckRecordStatusEnum.DRAFT };
        await formApi.setFieldValue('id', id);
        formMode.value = 'update';
      } else {
        await updateCheckRecord(data);
        formData.value = { ...formData.value, ...data };
      }
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
    const data = modalApi.getData<{ id?: number; type?: FormMode }>();
    formMode.value = data?.type || 'create';
    formApi.setDisabled(formMode.value === 'detail');
    modalApi.setState({ showConfirmButton: formMode.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getCheckRecord(data.id);
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
    <LineList v-if="formData?.id" :disabled="isDetail" :record-id="formData.id" />
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <Popconfirm
          v-if="canSubmit"
          title="确认提交该点检记录？提交后将不能修改。"
          @confirm="handleSubmit"
        >
          <Button type="primary">提交</Button>
        </Popconfirm>
      </div>
    </template>
  </Modal>
</template>
