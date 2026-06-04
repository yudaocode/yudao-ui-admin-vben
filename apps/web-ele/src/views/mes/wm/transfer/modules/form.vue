<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesWmTransferApi } from '#/api/mes/wm/transfer';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesWmTransferStatusEnum } from '@vben/constants';

import { ElButton, ElDivider, ElMessage, ElPopconfirm } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  confirmTransfer,
  createTransfer,
  finishTransfer,
  getTransfer,
  stockTransfer,
  submitTransfer,
  updateTransfer,
} from '#/api/mes/wm/transfer';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesWmTransferApi.Transfer>();
const originalSnapshot = ref(''); // 表单原始数据快照，用于提交时跳过未变更的保存请求
const isEditable = computed(() => // 是否为编辑模式（可保存）
  ['create', 'update'].includes(formType.value),
);
const isConfirm = computed(() => formType.value === 'confirm'); // 是否为到货确认模式
const isStock = computed(() => formType.value === 'stock'); // 是否为上架模式
const isFinish = computed(() => formType.value === 'finish'); // 是否为执行转移模式
const canSubmit = computed(() => // 编辑态草稿可提交
  formType.value === 'update' &&
  formData.value?.status === MesWmTransferStatusEnum.PREPARE,
);
const getTitle = computed(() => {
  switch (formType.value) {
    case 'confirm': {
      return '到货确认';
    }
    case 'detail': {
      return $t('ui.actionTitle.view', ['转移单']);
    }
    case 'finish': {
      return '执行转移';
    }
    case 'stock': {
      return '执行上架';
    }
    case 'update': {
      return $t('ui.actionTitle.edit', ['转移单']);
    }
    default: {
      return $t('ui.actionTitle.create', ['转移单']);
    }
  }
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
});

/** 提交转移单：表单有修改时先保存，再调用提交接口 */
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid || !formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    const current = JSON.stringify(await formApi.getValues());
    if (current !== originalSnapshot.value) {
      const data = (await formApi.getValues()) as MesWmTransferApi.Transfer;
      await updateTransfer({ ...formData.value, ...data });
      originalSnapshot.value = current;
    }
    await submitTransfer(formData.value.id);
    ElMessage.success('提交成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 到货确认 */
async function handleConfirm() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await confirmTransfer(formData.value.id);
    ElMessage.success('确认成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 执行上架 */
async function handleStock() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await stockTransfer(formData.value.id);
    ElMessage.success('上架成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 执行转移 */
async function handleFinish() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await finishTransfer(formData.value.id);
    ElMessage.success('执行成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!isEditable.value) {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesWmTransferApi.Transfer;
    try {
      if (formData.value?.id) {
        await updateTransfer({ ...formData.value, ...data });
        formData.value = { ...formData.value, ...data };
      } else {
        const id = await createTransfer(data);
        formData.value = {
          ...data,
          id,
          status: MesWmTransferStatusEnum.PREPARE,
        };
        formType.value = 'update';
        // 创建成功后切换编辑态，重挂 schema 并回填主键 / 状态
        formApi.setState({ schema: useFormSchema(formType.value, formApi) });
        await formApi.setValues(formData.value);
      }
      originalSnapshot.value = JSON.stringify(await formApi.getValues());
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      originalSnapshot.value = '';
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    modalApi.setState({ showConfirmButton: isEditable.value });
    if (data?.id) {
      modalApi.lock();
      try {
        formData.value = await getTransfer(data.id);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    }
    originalSnapshot.value = JSON.stringify(await formApi.getValues());
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
    <!-- 非新建模式展示物料信息 -->
    <template v-if="formData?.id">
      <ElDivider>物料信息</ElDivider>
      <div class="mx-4">
        <LineList :form-type="formType" :transfer-id="formData.id" />
      </div>
    </template>
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <ElPopconfirm
          v-if="canSubmit"
          title="确认提交该转移单？【提交后将不能修改】"
          width="280"
          @confirm="handleSubmit"
        >
          <template #reference>
            <ElButton type="primary">提交</ElButton>
          </template>
        </ElPopconfirm>
        <ElPopconfirm
          v-if="isConfirm"
          title="确认到货后，将进入待上架状态，是否继续？"
          width="280"
          @confirm="handleConfirm"
        >
          <template #reference>
            <ElButton type="primary">到货确认</ElButton>
          </template>
        </ElPopconfirm>
        <ElPopconfirm
          v-if="isStock"
          title="确认执行上架？"
          width="220"
          @confirm="handleStock"
        >
          <template #reference>
            <ElButton type="primary">执行上架</ElButton>
          </template>
        </ElPopconfirm>
        <ElPopconfirm
          v-if="isFinish"
          title="确认执行调拨？执行后将更新库存。"
          width="280"
          @confirm="handleFinish"
        >
          <template #reference>
            <ElButton type="primary">执行转移</ElButton>
          </template>
        </ElPopconfirm>
      </div>
    </template>
  </Modal>
</template>
