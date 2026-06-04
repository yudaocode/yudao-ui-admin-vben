<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesProWorkOrderApi } from '#/api/mes/pro/workorder';
import type { MesProWorkOrderBomApi } from '#/api/mes/pro/workorder/bom';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  BarcodeBizTypeEnum,
  MesProWorkOrderStatusEnum,
} from '@vben/constants';

import { Button, message, Popconfirm, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  confirmWorkOrder,
  createWorkOrder,
  finishWorkOrder,
  getWorkOrder,
  updateWorkOrder,
} from '#/api/mes/pro/workorder';
import { $t } from '#/locales';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useFormSchema } from '../data';
import BomList from './bom-list.vue';
import ItemList from './item-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesProWorkOrderApi.WorkOrder>();
const originalSnapshot = ref(''); // 表单原始数据快照，用于确认时跳过未变更的保存请求
const subTabsName = ref('bom'); // 当前选中的子表 Tab
const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>(); // 条码详情弹窗

const isEditable = computed(() => // 是否为编辑模式（可保存）
  ['create', 'update'].includes(formType.value),
);
const isConfirm = computed(() => formType.value === 'confirm'); // 是否为确认模式
const isFinish = computed(() => formType.value === 'finish'); // 是否为完成模式
const canConfirm = computed(() => // 编辑态草稿可确认
  formType.value === 'update' &&
  formData.value?.status === MesProWorkOrderStatusEnum.PREPARE,
);
const getTitle = computed(() => {
  const isChild = !!formData.value?.parentId;
  switch (formType.value) {
    case 'confirm': {
      return '确认工单';
    }
    case 'detail': {
      return $t('ui.actionTitle.view', ['工单']);
    }
    case 'finish': {
      return '完成工单';
    }
    case 'update': {
      return isChild ? '编辑子工单' : $t('ui.actionTitle.edit', ['工单']);
    }
    default: {
      return isChild ? '新增子工单' : $t('ui.actionTitle.create', ['工单']);
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

/** 重新挂载 schema 并按表单态控制底部确认按钮 */
function applySchema() {
  formApi.setState({ schema: useFormSchema(formType.value, formApi) });
  modalApi.setState({ showConfirmButton: isEditable.value });
}

/** 查看工单条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return;
  }
  barcodeDetailRef.value?.openByBusiness(
    formData.value.id,
    BarcodeBizTypeEnum.WORKORDER,
    formData.value.code,
    formData.value.name,
  );
}

/** 确认工单：编辑态有修改时先保存，再确认 */
async function handleConfirm() {
  const { valid } = await formApi.validate();
  if (!valid || !formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    if (isEditable.value) {
      const current = JSON.stringify(await formApi.getValues());
      if (current !== originalSnapshot.value) {
        const data = (await formApi.getValues()) as MesProWorkOrderApi.WorkOrder;
        await updateWorkOrder({ ...formData.value, ...data });
        originalSnapshot.value = current;
      }
    }
    await confirmWorkOrder(formData.value.id);
    message.success('工单已确认');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 完成工单 */
async function handleFinish() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await finishWorkOrder(formData.value.id);
    message.success('工单已完成');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 从 BOM 物料行预填子工单：复用当前工单上下文，进入新增态 */
async function handleGenerateWorkOrder(
  bomRow: MesProWorkOrderBomApi.WorkOrderBom,
) {
  const current = formData.value;
  if (!current) {
    return;
  }
  formData.value = undefined;
  formType.value = 'create';
  subTabsName.value = 'bom';
  applySchema();
  await formApi.resetForm();
  await formApi.setValues({
    clientId: current.clientId,
    name: `${bomRow.itemName}【${bomRow.quantity}】${bomRow.unitMeasureName || ''}`,
    orderSourceCode: current.orderSourceCode,
    orderSourceType: current.orderSourceType,
    parentId: current.id,
    productId: bomRow.itemId,
    quantity: bomRow.quantity,
    requestDate: current.requestDate,
    type: current.type,
    vendorId: current.vendorId,
  });
  originalSnapshot.value = JSON.stringify(await formApi.getValues());
  message.info('已从 BOM 物料预填子工单，请补充工单编码等信息后保存');
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
    const data = (await formApi.getValues()) as MesProWorkOrderApi.WorkOrder;
    try {
      if (formData.value?.id) {
        await updateWorkOrder({ ...formData.value, ...data });
        formData.value = { ...formData.value, ...data };
      } else {
        const id = await createWorkOrder(data);
        formData.value = {
          ...data,
          id,
          status: MesProWorkOrderStatusEnum.PREPARE,
        };
        formType.value = 'update';
        // 创建成功后切换编辑态，重挂 schema 让「工单状态」字段显现
        applySchema();
        await formApi.setValues(formData.value);
      }
      originalSnapshot.value = JSON.stringify(await formApi.getValues());
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
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
    const data = modalApi.getData<{
      formType: FormType;
      id?: number;
      parentRow?: MesProWorkOrderApi.WorkOrder;
    }>();
    formType.value = data.formType;
    subTabsName.value = 'bom';
    applySchema();
    if (data?.id) {
      modalApi.lock();
      try {
        formData.value = await getWorkOrder(data.id);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    } else if (data?.parentRow) {
      // 新增子工单时，预填父工单信息
      const parent = data.parentRow;
      await formApi.setValues({
        clientId: parent.clientId,
        orderSourceCode: parent.orderSourceCode,
        orderSourceType: parent.orderSourceType,
        parentId: parent.id,
        requestDate: parent.requestDate,
        type: parent.type,
        vendorId: parent.vendorId,
      });
    }
    originalSnapshot.value = JSON.stringify(await formApi.getValues());
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
    <!-- BOM / 物料需求 Tab：非新建态展示 -->
    <template v-if="formData?.id">
      <Tabs v-model:active-key="subTabsName" class="mx-4">
        <Tabs.TabPane key="bom" tab="工单 BOM">
          <BomList
            :form-type="formType"
            :work-order="formData"
            :work-order-id="formData.id"
            @generate-work-order="handleGenerateWorkOrder"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="item" tab="物料需求">
          <ItemList :work-order-id="formData.id" />
        </Tabs.TabPane>
      </Tabs>
    </template>
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <Popconfirm
          v-if="canConfirm || isConfirm"
          title="确认要完成工单编制吗？确认后将不能更改。"
          @confirm="handleConfirm"
        >
          <Button type="primary">确认</Button>
        </Popconfirm>
        <Popconfirm
          v-if="isFinish"
          title="确认要完成该工单吗？"
          @confirm="handleFinish"
        >
          <Button type="primary">完成</Button>
        </Popconfirm>
        <Button
          v-if="formType === 'detail' && formData?.id"
          @click="handleBarcode"
        >
          查看条码
        </Button>
      </div>
    </template>
  </Modal>
  <BarcodeDetail ref="barcodeDetailRef" />
</template>
