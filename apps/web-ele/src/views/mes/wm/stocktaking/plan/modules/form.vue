<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesWmStockTakingPlanApi } from '#/api/mes/wm/stocktaking/plan';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElDivider, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createStockTakingPlan,
  getStockTakingPlan,
  updateStockTakingPlan,
} from '#/api/mes/wm/stocktaking/plan';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import ParamList from './param-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesWmStockTakingPlanApi.StockTakingPlan>();
const isDetail = computed(() => formType.value === 'detail');
const showParam = computed(
  () =>
    (formType.value === 'detail' || formType.value === 'update') &&
    !!formData.value?.id,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['盘点方案']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['盘点方案'])
    : $t('ui.actionTitle.create', ['盘点方案']);
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
    // 提交表单
    const data =
      (await formApi.getValues()) as MesWmStockTakingPlanApi.StockTakingPlan;
    try {
      if (formData.value?.id) {
        await updateStockTakingPlan({ ...data, id: formData.value.id });
        // 关闭并提示
        await modalApi.close();
        emit('success');
        ElMessage.success($t('ui.actionMessage.operationSuccess'));
      } else {
        // 新增成功后切换为编辑态，继续维护盘点参数
        const id = await createStockTakingPlan(data);
        formData.value = { ...data, id };
        await formApi.setFieldValue('id', id);
        formType.value = 'update';
        emit('success');
        ElMessage.success($t('ui.actionMessage.operationSuccess'));
      }
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
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getStockTakingPlan(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
    <!-- 编辑或详情时展示盘点参数 -->
    <template v-if="showParam">
      <ElDivider>盘点参数</ElDivider>
      <div class="mx-4">
        <ParamList :disabled="isDetail" :plan-id="formData!.id!" />
      </div>
    </template>
  </Modal>
</template>
