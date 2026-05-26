<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesDvRepairApi } from '#/api/mes/dv/repair';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Popconfirm } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  confirmRepair,
  createRepair,
  finishRepair,
  getRepair,
  submitRepair,
  updateRepair,
} from '#/api/mes/dv/repair';
import { $t } from '#/locales';
import { MesDvRepairResultEnum, MesDvRepairStatusEnum } from '#/views/mes/utils/constants';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesDvRepairApi.Repair>();
const isDetail = computed(() => formType.value === 'detail');
const isReadonly = computed(() => ['confirm', 'detail', 'finish'].includes(formType.value));
const canSubmit = computed(
  () => formType.value === 'update' && formData.value?.status === MesDvRepairStatusEnum.PREPARE,
);
const getTitle = computed(
  () =>
    ({
      create: '新增维修工单',
      update: '修改维修工单',
      confirm: '完成维修',
      finish: '验收维修',
      detail: '查看维修工单',
    })[formType.value],
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  wrapperClass: 'grid-cols-3',
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

/** 表单 schema 需要 formApi 引用，所以通过 setState 设置 schema */
formApi.setState({ schema: useFormSchema(formApi) });

/** 提交维修工单 */
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid || !formData.value?.id) {
    return;
  }
  await doSubmit();
}

/** 执行维修工单提交 */
async function doSubmit() {
  modalApi.lock();
  try {
    await updateRepair((await formApi.getValues()) as MesDvRepairApi.Repair);
    await submitRepair(formData.value!.id!);
    await modalApi.close();
    emit('success');
    message.success('提交成功');
  } finally {
    modalApi.unlock();
  }
}

/** 完成维修 */
async function handleConfirm() {
  const { valid } = await formApi.validate();
  if (!valid || !formData.value?.id) {
    return;
  }
  const values = (await formApi.getValues()) as MesDvRepairApi.Repair;
  await doConfirm(values);
}

/** 执行完成维修 */
async function doConfirm(values: MesDvRepairApi.Repair) {
  modalApi.lock();
  try {
    await confirmRepair({
      id: formData.value!.id,
      finishDate: values.finishDate,
    });
    await modalApi.close();
    emit('success');
    message.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    modalApi.unlock();
  }
}

/** 验收维修 */
async function handleFinish(result: number) {
  if (!formData.value?.id) {
    return;
  }
  await doFinish(result);
}

/** 执行维修验收 */
async function doFinish(result: number) {
  modalApi.lock();
  try {
    await finishRepair(formData.value!.id!, result);
    await modalApi.close();
    emit('success');
    message.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (isDetail.value || formType.value === 'confirm' || formType.value === 'finish') {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesDvRepairApi.Repair;
    try {
      if (formType.value === 'create') {
        const id = await createRepair(data);
        formData.value = { ...data, id: id as number, status: MesDvRepairStatusEnum.PREPARE };
        await formApi.setFieldValue('id', id);
        formType.value = 'update';
      } else {
        await updateRepair(data);
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
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setDisabled(isReadonly.value);
    modalApi.setState({ showConfirmButton: ['create', 'update'].includes(formType.value) });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getRepair(data.id);
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
    <LineList v-if="formData?.id" :disabled="isReadonly" :repair-id="formData.id" />
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <Popconfirm
          v-if="canSubmit"
          title="确认提交该维修工单？提交后将不能修改。"
          @confirm="handleSubmit"
        >
          <Button type="primary">提交</Button>
        </Popconfirm>
        <Popconfirm
          v-if="formType === 'confirm'"
          title="确认完成维修？完成后进入待验收。"
          @confirm="handleConfirm"
        >
          <Button type="primary">完成维修</Button>
        </Popconfirm>
        <Popconfirm
          v-if="formType === 'finish'"
          title="确认完成验收？"
          @confirm="handleFinish(MesDvRepairResultEnum.PASS)"
        >
          <Button type="primary">验收通过</Button>
        </Popconfirm>
        <Popconfirm
          v-if="formType === 'finish'"
          title="确认完成验收？"
          @confirm="handleFinish(MesDvRepairResultEnum.FAIL)"
        >
          <Button>不通过</Button>
        </Popconfirm>
      </div>
    </template>
  </Modal>
</template>
