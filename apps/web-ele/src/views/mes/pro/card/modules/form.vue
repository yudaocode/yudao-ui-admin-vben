<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesProCardApi } from '#/api/mes/pro/card';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  BarcodeBizTypeEnum,
  MesProCardStatusEnum,
} from '@vben/constants';

import { ElButton, ElDivider, ElMessage, ElPopconfirm } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createCard,
  finishCard,
  getCard,
  submitCard,
  updateCard,
} from '#/api/mes/pro/card';
import { $t } from '#/locales';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useFormSchema } from '../data';
import ProcessList from './process-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesProCardApi.Card>();
const originalSnapshot = ref(''); // 表单原始数据快照，用于提交时跳过未变更的保存请求
const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>(); // 条码详情弹窗

const isEditable = computed(() => // 是否为编辑模式（可保存）
  ['create', 'update'].includes(formType.value),
);
const isFinish = computed(() => formType.value === 'finish'); // 是否为完成模式
const canSubmit = computed(() => // 编辑态草稿可提交
  formType.value === 'update' &&
  formData.value?.status === MesProCardStatusEnum.PREPARE,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['流转卡']);
  }
  if (formType.value === 'finish') {
    return '完成流转卡';
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['流转卡'])
    : $t('ui.actionTitle.create', ['流转卡']);
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

/** 查看流转卡条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return;
  }
  barcodeDetailRef.value?.openByBusiness(
    formData.value.id,
    BarcodeBizTypeEnum.PROCARD,
    formData.value.code,
  );
}

/** 提交流转卡：表单有修改时先保存，再调用提交接口 */
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid || !formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    const current = JSON.stringify(await formApi.getValues());
    if (current !== originalSnapshot.value) {
      const data = (await formApi.getValues()) as MesProCardApi.Card;
      await updateCard({ ...formData.value, ...data });
      originalSnapshot.value = current;
    }
    await submitCard(formData.value.id);
    ElMessage.success('提交成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 完成流转卡 */
async function handleFinish() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await finishCard(formData.value.id);
    ElMessage.success('完成成功');
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
    const data = (await formApi.getValues()) as MesProCardApi.Card;
    try {
      if (formData.value?.id) {
        await updateCard({ ...formData.value, ...data });
        formData.value = { ...formData.value, ...data };
      } else {
        const id = await createCard(data);
        formData.value = { ...data, id, status: MesProCardStatusEnum.PREPARE };
        await formApi.setFieldValue('id', id);
        await formApi.setFieldValue('status', formData.value.status);
        formType.value = 'update';
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
        formData.value = await getCard(data.id);
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
    <!-- 工序记录子表：非新建态展示 -->
    <template v-if="formData?.id">
      <ElDivider>工序记录</ElDivider>
      <div class="mx-4">
        <ProcessList :card-id="formData.id" :disabled="!isEditable" />
      </div>
    </template>
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <ElPopconfirm
          v-if="canSubmit"
          title="确认提交该流转卡？【提交后将不能修改】"
          width="280"
          @confirm="handleSubmit"
        >
          <template #reference>
            <ElButton type="primary">提交</ElButton>
          </template>
        </ElPopconfirm>
        <ElPopconfirm
          v-if="isFinish"
          title="确认完成该流转卡？"
          width="220"
          @confirm="handleFinish"
        >
          <template #reference>
            <ElButton type="primary">完成</ElButton>
          </template>
        </ElPopconfirm>
        <ElButton
          v-if="formType === 'detail' && formData?.id"
          @click="handleBarcode"
        >
          查看条码
        </ElButton>
      </div>
    </template>
  </Modal>
  <BarcodeDetail ref="barcodeDetailRef" />
</template>
