<script lang="ts" setup>
import type { MallDeliveryExpressTemplateApi } from '#/api/mall/trade/delivery/expressTemplate';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { cloneDeep } from '@vben/utils';

import {
  Cascader,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  RadioGroup,
} from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createDeliveryExpressTemplate,
  getDeliveryExpressTemplate,
  updateDeliveryExpressTemplate,
} from '#/api/mall/trade/delivery/expressTemplate';
import { getAreaTree } from '#/api/system/area';
import { $t } from '#/locales';

import { useChargesColumns, useFreesColumns } from '../data';

const emit = defineEmits(['success']);
const formRef = ref();
const chargesGridRef = ref();
const freesGridRef = ref();

const formData = ref<any>({
  id: undefined,
  name: '',
  chargeMode: 1,
  sort: 0,
  charges: [],
  frees: [],
});

const areaTree = ref([]);
const columnTitleMap = new Map();
const columnTitle = ref({
  startCountTitle: '首件',
  extraCountTitle: '续件',
  freeCountTitle: '包邮件数',
});

const chargeModeOptions = getDictOptions(
  DICT_TYPE.EXPRESS_CHARGE_MODE,
  'number',
);
const cascaderProps = {
  multiple: true,
  checkStrictly: false,
  label: 'name',
  value: 'id',
  children: 'children',
};

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['快递模板'])
    : $t('ui.actionTitle.create', ['快递模板']);
});

const formRules = {
  name: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
  chargeMode: [
    { required: true, message: '配送计费方式不能为空', trigger: 'change' },
  ],
  sort: [{ required: true, message: '分类排序不能为空', trigger: 'blur' }],
};

// 运费设置表格
const [ChargesGrid, chargesGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useChargesColumns(),
    data: formData.value.charges,
    minHeight: 200,
    autoResize: true,
    border: true,
    rowConfig: {
      keyField: 'seq',
      isHover: true,
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

// 包邮设置表格
const [FreesGrid, freesGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useFreesColumns(),
    data: formData.value.frees,
    minHeight: 200,
    autoResize: true,
    border: true,
    rowConfig: {
      keyField: 'seq',
      isHover: true,
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    try {
      await formRef.value?.validate();
      validateTables();
    } catch {
      return;
    }

    modalApi.lock();
    try {
      const data = cloneDeep(formData.value);
      // 前端价格以元展示，提交到后端用分计算
      data.charges?.forEach((item: any) => {
        item.startPrice = Math.round(item.startPrice * 100);
        item.extraPrice = Math.round(item.extraPrice * 100);
      });
      data.frees?.forEach((item: any) => {
        item.freePrice = Math.round(item.freePrice * 100);
      });

      await (formData.value?.id
        ? updateDeliveryExpressTemplate(data)
        : createDeliveryExpressTemplate(data));

      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetFormData();
      return;
    }

    const data =
      modalApi.getData<MallDeliveryExpressTemplateApi.ExpressTemplate>();
    if (!data || !data.id) {
      resetFormData();
      initDefaultData();
    } else {
      await loadFormData(data.id);
    }

    await nextTick();
    updateTables();
  },
});

// 重置表单数据
function resetFormData() {
  formData.value = {
    id: undefined,
    name: '',
    chargeMode: 1,
    sort: 0,
    charges: [],
    frees: [],
  };
}

// 初始化默认数据
function initDefaultData() {
  formData.value.charges = [
    {
      seq: Date.now(),
      areaIds: [1],
      startCount: 2,
      startPrice: 5,
      extraCount: 5,
      extraPrice: 10,
    },
  ];
}

// 加载表单数据
async function loadFormData(id: number) {
  modalApi.lock();
  try {
    const data = await getDeliveryExpressTemplate(id);
    formData.value = data;
    columnTitle.value = columnTitleMap.get(formData.value.chargeMode);

    // 前端价格以元展示
    formData.value.charges?.forEach((item: any, index: number) => {
      item.seq = item.seq || Date.now() + index;
      item.startPrice = item.startPrice / 100;
      item.extraPrice = item.extraPrice / 100;
    });
    formData.value.frees?.forEach((item: any, index: number) => {
      item.seq = item.seq || Date.now() + index;
      item.freePrice = item.freePrice / 100;
    });
  } finally {
    modalApi.unlock();
  }
}

// 更新表格数据
async function updateTables() {
  await nextTick();
  if (chargesGridApi.grid) {
    await chargesGridApi.grid.reloadData(formData.value.charges || []);
  }
  if (freesGridApi.grid) {
    await freesGridApi.grid.reloadData(formData.value.frees || []);
  }
}

// 计费方式改变
function handleChargeModeChange(value: number) {
  columnTitle.value = columnTitleMap.get(value);
  updateChargesColumns();
}

// 更新运费表格列标题
function updateChargesColumns() {
  const columns = useChargesColumns();
  // 根据计费方式更新列标题
  const startCountCol = columns.find((col) => col.field === 'startCount');
  const extraCountCol = columns.find((col) => col.field === 'extraCount');

  if (startCountCol) startCountCol.title = columnTitle.value.startCountTitle;
  if (extraCountCol) extraCountCol.title = columnTitle.value.extraCountTitle;

  chargesGridApi.grid.reloadColumn(columns);
}

// 更新包邮表格列标题
function updateFreesColumns() {
  const columns = useFreesColumns();
  const freeCountCol = columns.find((col) => col.field === 'freeCount');

  if (freeCountCol) freeCountCol.title = columnTitle.value.freeCountTitle;

  freesGridApi.grid.reloadColumn(columns);
}

// 添加计费区域
function addChargeArea() {
  const newRow = {
    seq: Date.now(),
    areaIds: [],
    startCount: 1,
    startPrice: 1,
    extraCount: 1,
    extraPrice: 1,
  };
  formData.value.charges.push(newRow);
  chargesGridApi.grid.reloadData(formData.value.charges);
}

// 删除计费区域
function deleteChargeArea(row: any) {
  const index = formData.value.charges.findIndex(
    (item: any) => item.seq === row.seq,
  );
  if (index !== -1) {
    formData.value.charges.splice(index, 1);
    chargesGridApi.grid.reloadData(formData.value.charges);
  }
}

// 添加包邮区域
function addFreeArea() {
  const newRow = {
    seq: Date.now(),
    areaIds: [],
    freeCount: 1,
    freePrice: 1,
  };
  formData.value.frees.push(newRow);
  freesGridApi.grid.reloadData(formData.value.frees);
}

// 删除包邮区域
function deleteFreeArea(row: any) {
  const index = formData.value.frees.findIndex(
    (item: any) => item.seq === row.seq,
  );
  if (index !== -1) {
    formData.value.frees.splice(index, 1);
    freesGridApi.grid.reloadData(formData.value.frees);
  }
}

// 处理运费区域变更
function handleChargeAreaChange(areaIds: any[], row: any) {
  row.areaIds = areaIds;
}

// 处理包邮区域变更
function handleFreeAreaChange(areaIds: any[], row: any) {
  row.areaIds = areaIds;
}

// 处理数值变更
function handleChargeValueChange(field: string, value: any, row: any) {
  row[field] = value;
}

function handleFreeValueChange(field: string, value: any, row: any) {
  row[field] = value;
}

// 表格验证
function validateTables() {
  for (let i = 0; i < formData.value.charges.length; i++) {
    const item = formData.value.charges[i];
    if (!item.areaIds || item.areaIds.length === 0) {
      throw new Error(`运费设置第 ${i + 1} 行：区域不能为空`);
    }
    if (!item.startCount || item.startCount <= 0) {
      throw new Error(`运费设置第 ${i + 1} 行：首件数必须大于0`);
    }
    if (!item.startPrice || item.startPrice <= 0) {
      throw new Error(`运费设置第 ${i + 1} 行：运费必须大于0`);
    }
  }

  for (let i = 0; i < formData.value.frees.length; i++) {
    const item = formData.value.frees[i];
    if (!item.areaIds || item.areaIds.length === 0) {
      throw new Error(`包邮设置第 ${i + 1} 行：区域不能为空`);
    }
    if (!item.freeCount || item.freeCount <= 0) {
      throw new Error(`包邮设置第 ${i + 1} 行：包邮件数必须大于0`);
    }
    if (!item.freePrice || item.freePrice <= 0) {
      throw new Error(`包邮设置第 ${i + 1} 行：包邮金额必须大于0`);
    }
  }
}

// 初始化数据
async function initData() {
  // 表头标题和计费方式的映射
  columnTitleMap.set(1, {
    startCountTitle: '首件',
    extraCountTitle: '续件',
    freeCountTitle: '包邮件数',
  });
  columnTitleMap.set(2, {
    startCountTitle: '首件重量(kg)',
    extraCountTitle: '续件重量(kg)',
    freeCountTitle: '包邮重量(kg)',
  });
  columnTitleMap.set(3, {
    startCountTitle: '首件体积(m³)',
    extraCountTitle: '续件体积(m³)',
    freeCountTitle: '包邮体积(m³)',
  });

  // 加载区域数据
  try {
    areaTree.value = await getAreaTree();
  } catch (error) {
    console.error('加载区域数据失败:', error);
  }
}

onMounted(() => {
  initData();
});

// 监听计费方式变化
watch(
  () => formData.value.chargeMode,
  () => {
    updateChargesColumns();
    updateFreesColumns();
  },
);
</script>

<template>
  <Modal class="w-[80%]" :title="getTitle">
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      class="mx-4"
    >
      <FormItem label="模板名称" name="name">
        <Input v-model:value="formData.name" placeholder="请输入模板名称" />
      </FormItem>

      <FormItem label="计费方式" name="chargeMode">
        <RadioGroup
          v-model:value="formData.chargeMode"
          :options="chargeModeOptions"
          @change="handleChargeModeChange"
        />
      </FormItem>

      <FormItem label="运费设置">
        <ChargesGrid ref="chargesGridRef">
          <template #areaIds="{ row }">
            <Cascader
              v-model:value="row.areaIds"
              :options="areaTree"
              :field-names="cascaderProps"
              placeholder="请选择地区"
              class="w-full"
              multiple
              show-checked-strategy="SHOW_CHILD"
              @change="handleChargeAreaChange($event, row)"
            />
          </template>
          <template #startCount="{ row }">
            <InputNumber
              v-model:value="row.startCount"
              :min="1"
              class="w-full"
              @change="handleChargeValueChange('startCount', $event, row)"
            />
          </template>
          <template #startPrice="{ row }">
            <InputNumber
              v-model:value="row.startPrice"
              :min="0"
              :precision="2"
              class="w-full"
              @change="handleChargeValueChange('startPrice', $event, row)"
            />
          </template>
          <template #extraCount="{ row }">
            <InputNumber
              v-model:value="row.extraCount"
              :min="1"
              class="w-full"
              @change="handleChargeValueChange('extraCount', $event, row)"
            />
          </template>
          <template #extraPrice="{ row }">
            <InputNumber
              v-model:value="row.extraPrice"
              :min="0"
              :precision="2"
              class="w-full"
              @change="handleChargeValueChange('extraPrice', $event, row)"
            />
          </template>
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label: '删除',
                  type: 'link',
                  danger: true,
                  popConfirm: {
                    title: '确认删除该区域吗？',
                    confirm: deleteChargeArea.bind(null, row),
                  },
                },
              ]"
            />
          </template>

          <template #bottom>
            <TableAction
              class="mt-2 flex justify-center"
              :actions="[
                {
                  label: '添加计费区域',
                  type: 'default',
                  onClick: addChargeArea,
                },
              ]"
            />
          </template>
        </ChargesGrid>
      </FormItem>

      <FormItem label="包邮设置">
        <FreesGrid ref="freesGridRef">
          <template #areaIds="{ row }">
            <Cascader
              v-model:value="row.areaIds"
              :options="areaTree"
              :field-names="cascaderProps"
              placeholder="请选择地区"
              class="w-full"
              multiple
              show-checked-strategy="SHOW_CHILD"
              @change="handleFreeAreaChange($event, row)"
            />
          </template>
          <template #freeCount="{ row }">
            <InputNumber
              v-model:value="row.freeCount"
              :min="1"
              class="w-full"
              @change="handleFreeValueChange('freeCount', $event, row)"
            />
          </template>
          <template #freePrice="{ row }">
            <InputNumber
              v-model:value="row.freePrice"
              :min="0"
              :precision="2"
              class="w-full"
              @change="handleFreeValueChange('freePrice', $event, row)"
            />
          </template>
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label: '删除',
                  type: 'link',
                  danger: true,
                  popConfirm: {
                    title: '确认删除该区域吗？',
                    confirm: deleteFreeArea.bind(null, row),
                  },
                },
              ]"
            />
          </template>

          <template #bottom>
            <TableAction
              class="mt-2 flex justify-center"
              :actions="[
                {
                  label: '添加包邮区域',
                  type: 'default',
                  onClick: addFreeArea,
                },
              ]"
            />
          </template>
        </FreesGrid>
      </FormItem>

      <FormItem label="排序" name="sort">
        <InputNumber
          v-model:value="formData.sort"
          :min="0"
          placeholder="请输入显示顺序"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
