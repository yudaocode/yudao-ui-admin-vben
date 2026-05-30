<script lang="ts" setup>
import type { MesWmStockTakingPlanParamApi } from '#/api/mes/wm/stocktaking/plan/param';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import {
  createStockTakingPlanParam,
  getStockTakingPlanParam,
  updateStockTakingPlanParam,
} from '#/api/mes/wm/stocktaking/plan/param';
import { getWarehouseArea } from '#/api/mes/wm/warehouse/area';
import { getWarehouseLocation } from '#/api/mes/wm/warehouse/location';
import { $t } from '#/locales';
import MdItemSelect from '#/views/mes/md/item/components/md-item-select.vue';
import { MesWmStockTakingParamTypeEnum } from '#/views/mes/utils/constants';
import { WmBatchSelect } from '#/views/mes/wm/batch/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '#/views/mes/wm/warehouse/components';

const emit = defineEmits(['success']);
const formData = ref<MesWmStockTakingPlanParamApi.StockTakingPlanParam>({});
const planId = ref<number>();
const locationWarehouseId = ref<number>(); // 库区选择器临时数据：选仓库后传给库区选择器
const areaWarehouseId = ref<number>(); // 库位选择器临时数据：选仓库后传给库区选择器
const areaLocationId = ref<number>(); // 库位选择器临时数据：选库区后传给库位选择器

const paramTypeOptions = getDictOptions(
  DICT_TYPE.MES_WM_STOCK_TAKING_PLAN_PARAM_TYPE,
  'number',
).map(({ label, value }) => ({ label, value: Number(value) }));
const qualityStatusOptions = getDictOptions(
  DICT_TYPE.MES_WM_QUALITY_STATUS,
  'string',
).map(({ label, value }) => ({ label, value: String(value) }));

const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['盘点条件'])
    : $t('ui.actionTitle.create', ['盘点条件']),
);

/** 条件类型变化：清空已选条件值和级联临时数据 */
function handleTypeChange() {
  formData.value.valueId = undefined;
  formData.value.valueCode = '';
  formData.value.valueName = '';
  locationWarehouseId.value = undefined;
  areaWarehouseId.value = undefined;
  areaLocationId.value = undefined;
}

/** 通用选择器变化：回填条件值编码、名称 */
function handleSelectorChange(item?: any) {
  formData.value.valueId = item?.id;
  formData.value.valueCode = item?.code || '';
  formData.value.valueName = item?.name || item?.nickname || '';
}

/** 批次选择器变化 */
function handleBatchChange(batch?: any) {
  formData.value.valueId = batch?.id;
  formData.value.valueCode = batch?.code || '';
  formData.value.valueName = batch?.code || '';
}

/** 质量状态选择器变化：无实体编号，仅记录字典编码和文案 */
function handleQualityStatusChange(value: any) {
  const selected = qualityStatusOptions.find((item) => item.value === value);
  formData.value.valueId = undefined;
  formData.value.valueCode = value;
  formData.value.valueName = selected?.label || '';
}

/** 库区仓库选择回调：清空库区 */
function handleLocationWarehouseChange() {
  formData.value.valueId = undefined;
  formData.value.valueCode = '';
  formData.value.valueName = '';
}

/** 库位仓库选择回调：清空库区和库位 */
function handleAreaWarehouseChange() {
  areaLocationId.value = undefined;
  formData.value.valueId = undefined;
  formData.value.valueCode = '';
  formData.value.valueName = '';
}

/** 库位库区选择回调：清空库位 */
function handleAreaLocationChange() {
  formData.value.valueId = undefined;
  formData.value.valueCode = '';
  formData.value.valueName = '';
}

/** 编辑时回填级联选择器的上级数据（库区所属仓库、库位所属仓库/库区） */
async function loadCascadeData() {
  if (!formData.value.type || !formData.value.valueId) {
    return;
  }
  const valueId = formData.value.valueId;
  if (formData.value.type === MesWmStockTakingParamTypeEnum.LOCATION) {
    const location = await getWarehouseLocation(valueId);
    locationWarehouseId.value = location?.warehouseId;
  } else if (formData.value.type === MesWmStockTakingParamTypeEnum.AREA) {
    const area = await getWarehouseArea(valueId);
    areaWarehouseId.value = area?.warehouseId;
    areaLocationId.value = area?.locationId;
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.value.type) {
      ElMessage.warning('请选择条件类型');
      return;
    }
    // 质量状态校验 valueCode，其余类型校验 valueId
    const valid =
      formData.value.type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS
        ? !!formData.value.valueCode
        : formData.value.valueId != null;
    if (!valid) {
      ElMessage.warning('请选择条件值');
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = {
      ...formData.value,
      planId: planId.value,
    } as MesWmStockTakingPlanParamApi.StockTakingPlanParam;
    try {
      await (formData.value.id
        ? updateStockTakingPlanParam(data)
        : createStockTakingPlanParam(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = {};
      locationWarehouseId.value = undefined;
      areaWarehouseId.value = undefined;
      areaLocationId.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ id?: number; planId: number }>();
    planId.value = data.planId;
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getStockTakingPlanParam(data.id);
      await loadCascadeData();
    } finally {
      modalApi.unlock();
    }
  },
});

const ParamTypeEnum = MesWmStockTakingParamTypeEnum;
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <ElForm class="mx-4" label-width="100px">
      <ElFormItem label="条件类型" required>
        <ElSelect
          v-model="formData.type"
          class="!w-full"
          placeholder="请选择条件类型"
          @change="handleTypeChange"
        >
          <ElOption
            v-for="dict in paramTypeOptions"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="formData.type" label="条件值" required>
        <WmWarehouseSelect
          v-if="formData.type === ParamTypeEnum.WAREHOUSE"
          v-model="formData.valueId"
          @change="handleSelectorChange"
        />
        <div
          v-else-if="formData.type === ParamTypeEnum.LOCATION"
          class="w-full space-y-2"
        >
          <WmWarehouseSelect
            v-model="locationWarehouseId"
            placeholder="请选择仓库"
            @change="handleLocationWarehouseChange"
          />
          <WmWarehouseLocationSelect
            v-if="locationWarehouseId"
            v-model="formData.valueId"
            placeholder="请选择库区"
            :warehouse-id="locationWarehouseId"
            @change="handleSelectorChange"
          />
        </div>
        <div
          v-else-if="formData.type === ParamTypeEnum.AREA"
          class="w-full space-y-2"
        >
          <WmWarehouseSelect
            v-model="areaWarehouseId"
            placeholder="请选择仓库"
            @change="handleAreaWarehouseChange"
          />
          <WmWarehouseLocationSelect
            v-if="areaWarehouseId"
            v-model="areaLocationId"
            placeholder="请选择库区"
            :warehouse-id="areaWarehouseId"
            @change="handleAreaLocationChange"
          />
          <WmWarehouseAreaSelect
            v-if="areaLocationId"
            v-model="formData.valueId"
            :location-id="areaLocationId"
            placeholder="请选择库位"
            @change="handleSelectorChange"
          />
        </div>
        <MdItemSelect
          v-else-if="formData.type === ParamTypeEnum.ITEM"
          v-model="formData.valueId"
          @change="handleSelectorChange"
        />
        <WmBatchSelect
          v-else-if="formData.type === ParamTypeEnum.BATCH"
          v-model="formData.valueId"
          @change="handleBatchChange"
        />
        <ElSelect
          v-else-if="formData.type === ParamTypeEnum.QUALITY_STATUS"
          v-model="formData.valueCode"
          class="!w-full"
          placeholder="请选择质量状态"
          @change="handleQualityStatusChange"
        >
          <ElOption
            v-for="dict in qualityStatusOptions"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput
          v-model="formData.remark"
          placeholder="请输入备注"
          :rows="3"
          type="textarea"
        />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
