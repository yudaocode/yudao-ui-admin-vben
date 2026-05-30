<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesMdItemBatchConfigApi } from '#/api/mes/md/item/batchConfig';

import { computed, ref, watch } from 'vue';

import { MesItemOrProductEnum } from '@vben/constants';

import { ElButton, ElCheckbox, ElMessage } from 'element-plus';

import {
  getBatchConfigByItemId,
  saveBatchConfig,
} from '#/api/mes/md/item/batchConfig';

const props = withDefaults(
  defineProps<{
    formType?: FormType;
    itemId: number;
    itemOrProduct?: string;
  }>(),
  {
    formType: 'update',
    itemOrProduct: '',
  },
);

const isReadOnly = computed(() => props.formType === 'detail'); // 是否只读
const loading = ref(false); // 批次属性加载/保存中
const formData = ref<MesMdItemBatchConfigApi.BatchConfig>(buildDefaultData());

/** 构建批次属性默认值 */
function buildDefaultData(): MesMdItemBatchConfigApi.BatchConfig {
  return {
    itemId: props.itemId,
    produceDateFlag: false,
    expireDateFlag: false,
    receiptDateFlag: false,
    vendorFlag: false,
    clientFlag: false,
    salesOrderCodeFlag: false,
    purchaseOrderCodeFlag: false,
    workorderFlag: false,
    taskFlag: false,
    workstationFlag: false,
    toolFlag: false,
    moldFlag: false,
    lotNumberFlag: false,
    qualityStatusFlag: false,
  };
}

/** 加载批次属性配置 */
async function loadData() {
  loading.value = true;
  try {
    const data = await getBatchConfigByItemId(props.itemId);
    formData.value = { ...buildDefaultData(), ...data };
  } finally {
    loading.value = false;
  }
}

/** 判断是否已选择批次属性 */
function hasAnySelected() {
  return Object.entries(formData.value).some(
    ([key, value]) => key.endsWith('Flag') && value === true,
  );
}

/** 保存批次属性配置 */
async function handleSave() {
  if (!hasAnySelected()) {
    ElMessage.warning('至少选择一个批次属性');
    return;
  }
  loading.value = true;
  try {
    await saveBatchConfig({ ...formData.value, itemId: props.itemId });
    ElMessage.success('保存成功');
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.itemId,
  (value) => {
    if (value) {
      loadData();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div v-loading="loading">
    <div v-if="!isReadOnly" class="mb-3 flex justify-end">
      <ElButton type="primary" @click="handleSave">保存批次属性</ElButton>
    </div>
    <div class="grid grid-cols-5 gap-x-5 gap-y-3">
      <ElCheckbox v-model="formData.produceDateFlag" :disabled="isReadOnly">
        生产日期
      </ElCheckbox>
      <ElCheckbox v-model="formData.qualityStatusFlag" :disabled="isReadOnly">
        质量状态
      </ElCheckbox>

      <template v-if="itemOrProduct === MesItemOrProductEnum.ITEM.value">
        <ElCheckbox v-model="formData.vendorFlag" :disabled="isReadOnly">
          供应商
        </ElCheckbox>
        <ElCheckbox
          v-model="formData.purchaseOrderCodeFlag"
          :disabled="isReadOnly"
        >
          采购订单编号
        </ElCheckbox>
        <ElCheckbox v-model="formData.lotNumberFlag" :disabled="isReadOnly">
          生产批号
        </ElCheckbox>
        <ElCheckbox v-model="formData.expireDateFlag" :disabled="isReadOnly">
          有效期
        </ElCheckbox>
        <ElCheckbox v-model="formData.receiptDateFlag" :disabled="isReadOnly">
          入库日期
        </ElCheckbox>
      </template>

      <template v-if="itemOrProduct === MesItemOrProductEnum.PRODUCT.value">
        <ElCheckbox v-model="formData.clientFlag" :disabled="isReadOnly">
          客户
        </ElCheckbox>
        <ElCheckbox
          v-model="formData.salesOrderCodeFlag"
          :disabled="isReadOnly"
        >
          销售订单编号
        </ElCheckbox>
        <ElCheckbox v-model="formData.workorderFlag" :disabled="isReadOnly">
          生产工单
        </ElCheckbox>
        <ElCheckbox v-model="formData.taskFlag" :disabled="isReadOnly">
          生产任务
        </ElCheckbox>
        <ElCheckbox v-model="formData.workstationFlag" :disabled="isReadOnly">
          工作站
        </ElCheckbox>
        <ElCheckbox v-model="formData.toolFlag" :disabled="isReadOnly">
          工具
        </ElCheckbox>
        <ElCheckbox v-model="formData.moldFlag" :disabled="isReadOnly">
          模具
        </ElCheckbox>
      </template>
    </div>
  </div>
</template>
