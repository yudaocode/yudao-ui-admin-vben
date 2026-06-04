<script lang="ts" setup>
import type { NumberDictDataType } from '@vben/hooks';

import { ref, watch } from 'vue';

import { DICT_TYPE, MesWmStockTakingParamTypeEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElOption, ElSelect } from 'element-plus';

import { getWarehouseArea } from '#/api/mes/wm/warehouse/area';
import { getWarehouseLocation } from '#/api/mes/wm/warehouse/location';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { WmBatchSelect } from '#/views/mes/wm/batch/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '#/views/mes/wm/warehouse/components';

defineOptions({ name: 'StockTakingPlanConditionValueInput' });

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    type?: number;
    valueCode?: string;
  }>(),
  {
    modelValue: undefined,
    type: undefined,
    valueCode: undefined,
  },
);
const emit = defineEmits<{
  'update:modelValue': [value?: number];
  valueChange: [
    payload: { valueCode?: string; valueId?: number; valueName?: string },
  ];
}>();

const qualityStatusOptions = getDictOptions(
  DICT_TYPE.MES_WM_QUALITY_STATUS,
  'number',
) as NumberDictDataType[];

const locationWarehouseId = ref<number>(); // 库区选择器临时数据：选仓库后传给库区选择器
const areaWarehouseId = ref<number>(); // 库位选择器临时数据：选仓库后传给库区选择器
const areaLocationId = ref<number>(); // 库位选择器临时数据：选库区后传给库位选择器

const qualityStatusValue = ref<number>();

/** 通用选择器变化：回填条件值编码、名称 */
function handleSelectorChange(item?: any) {
  emit('update:modelValue', item?.id);
  emit('valueChange', {
    valueId: item?.id,
    valueCode: item?.code || '',
    valueName: item?.name || item?.nickname || '',
  });
}

/** 批次选择器变化 */
function handleBatchChange(batch?: any) {
  emit('update:modelValue', batch?.id);
  emit('valueChange', {
    valueId: batch?.id,
    valueCode: batch?.code || '',
    valueName: batch?.code || '',
  });
}

/** 质量状态选择器变化：无实体编号，仅记录字典编码和文案 */
function handleQualityStatusChange(value?: number) {
  qualityStatusValue.value = value;
  const selected = qualityStatusOptions.find((item) => item.value === value);
  emit('update:modelValue', undefined);
  emit('valueChange', {
    valueId: undefined,
    valueCode: value == null ? '' : String(value),
    valueName: selected?.label || '',
  });
}

/** 库区仓库选择回调：清空库区 */
function handleLocationWarehouseChange() {
  emit('update:modelValue', undefined);
  emit('valueChange', { valueId: undefined, valueCode: '', valueName: '' });
}

/** 库位仓库选择回调：清空库区和库位 */
function handleAreaWarehouseChange() {
  areaLocationId.value = undefined;
  emit('update:modelValue', undefined);
  emit('valueChange', { valueId: undefined, valueCode: '', valueName: '' });
}

/** 库位库区选择回调：清空库位 */
function handleAreaLocationChange() {
  emit('update:modelValue', undefined);
  emit('valueChange', { valueId: undefined, valueCode: '', valueName: '' });
}

/** 编辑时回填级联选择器的上级数据（库区所属仓库、库位所属仓库/库区） */
async function loadCascadeData() {
  if (props.type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS) {
    qualityStatusValue.value = props.valueCode
      ? Number(props.valueCode)
      : undefined;
    return;
  }
  if (props.modelValue == null) {
    return;
  }
  if (props.type === MesWmStockTakingParamTypeEnum.LOCATION) {
    const location = await getWarehouseLocation(props.modelValue);
    locationWarehouseId.value = location?.warehouseId;
  } else if (props.type === MesWmStockTakingParamTypeEnum.AREA) {
    const area = await getWarehouseArea(props.modelValue);
    areaWarehouseId.value = area?.warehouseId;
    areaLocationId.value = area?.locationId;
  }
}

// 条件类型变化时重置级联临时数据；编辑回显时按类型加载上级数据
watch(
  () => props.type,
  () => {
    locationWarehouseId.value = undefined;
    areaWarehouseId.value = undefined;
    areaLocationId.value = undefined;
    qualityStatusValue.value = undefined;
    void loadCascadeData();
  },
  { immediate: true },
);
</script>

<template>
  <WmWarehouseSelect
    v-if="type === MesWmStockTakingParamTypeEnum.WAREHOUSE"
    :model-value="modelValue"
    @change="handleSelectorChange"
  />
  <div
    v-else-if="type === MesWmStockTakingParamTypeEnum.LOCATION"
    class="w-full space-y-2"
  >
    <WmWarehouseSelect
      v-model="locationWarehouseId"
      placeholder="请选择仓库"
      @change="handleLocationWarehouseChange"
    />
    <WmWarehouseLocationSelect
      v-if="locationWarehouseId"
      :model-value="modelValue"
      :warehouse-id="locationWarehouseId"
      placeholder="请选择库区"
      @change="handleSelectorChange"
    />
  </div>
  <div
    v-else-if="type === MesWmStockTakingParamTypeEnum.AREA"
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
      :model-value="modelValue"
      :location-id="areaLocationId"
      placeholder="请选择库位"
      @change="handleSelectorChange"
    />
  </div>
  <MdItemSelect
    v-else-if="type === MesWmStockTakingParamTypeEnum.ITEM"
    :model-value="modelValue"
    @change="handleSelectorChange"
  />
  <WmBatchSelect
    v-else-if="type === MesWmStockTakingParamTypeEnum.BATCH"
    :model-value="modelValue"
    @change="handleBatchChange"
  />
  <ElSelect
    v-else-if="type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS"
    :model-value="qualityStatusValue"
    class="!w-full"
    placeholder="请选择质量状态"
    @change="(value) => handleQualityStatusChange(value as number)"
  >
    <ElOption
      v-for="dict in qualityStatusOptions"
      :key="dict.value"
      :label="dict.label"
      :value="dict.value"
    />
  </ElSelect>
</template>
