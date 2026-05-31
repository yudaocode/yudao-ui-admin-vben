<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesMdWorkstationApi } from '#/api/mes/md/workstation';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum } from '@vben/constants';

import { ElButton, ElMessage, ElTabPane, ElTabs } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createWorkstation,
  getWorkstation,
  updateWorkstation,
} from '#/api/mes/md/workstation';
import { $t } from '#/locales';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useFormSchema } from '../data';
import MachineList from './machine-list.vue';
import ToolList from './tool-list.vue';
import WorkerList from './worker-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create'); // 表单模式
const subTabsName = ref('machine'); // 当前资源页签
const formData = ref<MesMdWorkstationApi.Workstation>();
const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>(); // 条码详情弹窗

const isDetail = computed(() => formType.value === 'detail'); // 是否查看模式
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return '查看工作站';
  }
  return formType.value === 'update' ? '修改工作站' : '新增工作站';
});

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

/** 查看工作站条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return;
  }
  barcodeDetailRef.value?.openByBusiness(
    formData.value.id,
    BarcodeBizTypeEnum.WORKSTATION,
    formData.value.code,
    formData.value.name,
  );
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
    // 提交表单
    const data = (await formApi.getValues()) as MesMdWorkstationApi.Workstation;
    try {
      if (formType.value === 'create') {
        const id = await createWorkstation(data);
        formData.value = { ...data, id };
        await formApi.setFieldValue('id', id);
        formType.value = 'update';
      } else {
        await updateWorkstation(data);
        formData.value = { ...formData.value, ...data };
      }
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    subTabsName.value = 'machine';
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(data.formType, formApi) });
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getWorkstation(data.id);
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
    <ElTabs
      v-if="formType !== 'create' && formData?.id"
      v-model="subTabsName"
      class="mx-4 mt-4"
    >
      <ElTabPane name="machine" label="设备资源">
        <MachineList :form-type="formType" :workstation-id="formData.id" />
      </ElTabPane>
      <ElTabPane name="tool" label="工装夹具">
        <ToolList :form-type="formType" :workstation-id="formData.id" />
      </ElTabPane>
      <ElTabPane name="worker" label="人力资源">
        <WorkerList :form-type="formType" :workstation-id="formData.id" />
      </ElTabPane>
    </ElTabs>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <ElButton
          v-if="isDetail && formData?.id"
          type="primary"
          @click="handleBarcode"
        >
          查看条码
        </ElButton>
      </div>
    </template>
    <BarcodeDetail ref="barcodeDetailRef" />
  </Modal>
</template>
