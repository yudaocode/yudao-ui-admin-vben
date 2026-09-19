<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaTravelApplyApi } from '#/api/oa/travel/apply';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import dayjs from 'dayjs';
import {
  ElButton,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRow,
  ElSelect,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createTravelApply,
  getTravelApply,
  updateTravelApply,
} from '#/api/oa/travel/apply';
import { AreaCascader } from '#/components/area';
import { FileUpload } from '#/components/upload';
import { $t } from '#/locales';

import { useItemGridColumns } from '../data';

defineOptions({ name: 'OaTravelApplyForm' });

const emit = defineEmits(['success']);

const formRef = ref();
const formLoading = ref(false); // 表单加载及保存状态
const formData = ref<OaTravelApplyApi.TravelApply>(createDefaultFormData()); // 单据
const formRules = reactive({
  reason: [{ required: true, message: '出差事由不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始日期不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '结束日期不能为空', trigger: 'change' }],
});

const getTitle = computed(() => {
  return formData.value.id
    ? $t('ui.actionTitle.edit', ['出差申请'])
    : $t('ui.actionTitle.create', ['出差申请']);
});

/** 按经过的时长计算天数，以 24 小时为一天，向上取整 */
const days = computed(() => {
  if (!formData.value.startTime || !formData.value.endTime) return undefined;
  return Math.ceil(
    dayjs(Number(formData.value.endTime)).diff(
      dayjs(Number(formData.value.startTime)),
      'hour',
      true,
    ) / 24,
  );
});

const [ItemGrid, itemGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useItemGridColumns(),
    data: [],
    maxHeight: 360,
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<OaTravelApplyApi.TravelApplyItem>,
});

/** 新增行程明细 */
async function addItem() {
  formData.value.items.push({});
  await reloadItems();
}

/** 删除行程明细 */
async function deleteItem(index: number) {
  formData.value.items.splice(index, 1);
  await reloadItems();
}

/** 刷新行程明细表格 */
async function reloadItems() {
  await nextTick();
  await itemGridApi.grid?.reloadData(formData.value.items);
}

/** 构造默认单据 */
function createDefaultFormData(): OaTravelApplyApi.TravelApply {
  return {
    status: BpmProcessInstanceStatus.NOT_START,
    items: [],
    fileUrls: [],
  };
}

/** 重置表单，避免再次新增时带入上次单据 */
function resetForm() {
  formData.value = createDefaultFormData();
  formRef.value?.clearValidate();
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    // 1. 校验表单及明细
    await formRef.value?.validate();
    if (!formData.value.items.length) {
      ElMessage.warning('请添加行程明细');
      return;
    }
    // 2. 保存单据，审批由列表发起
    modalApi.lock();
    formLoading.value = true;
    try {
      if (formData.value.id) {
        await updateTravelApply(formData.value);
      } else {
        formData.value.id = await createTravelApply(formData.value);
      }
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      formLoading.value = false;
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetForm();
      return;
    }
    resetForm();
    // 修改时，加载单据及明细
    const data = modalApi.getData() as { id?: number };
    if (!data?.id) {
      await reloadItems();
      return;
    }
    modalApi.lock();
    formLoading.value = true;
    try {
      formData.value = await getTravelApply(data.id);
      formData.value.items ||= [];
      formData.value.fileUrls ||= [];
      await reloadItems();
    } finally {
      formLoading.value = false;
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[1200px]">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="100px"
    >
      <ElFormItem label="出差事由" prop="reason">
        <ElInput
          v-model="formData.reason"
          :rows="2"
          placeholder="请输入出差事由"
          type="textarea"
        />
      </ElFormItem>
      <ElRow :gutter="20">
        <ElCol :span="9">
          <ElFormItem label="开始日期" prop="startTime">
            <ElDatePicker
              v-model="formData.startTime"
              class="!w-full"
              placeholder="请选择开始日期"
              type="datetime"
              value-format="x"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="9">
          <ElFormItem label="结束日期" prop="endTime">
            <ElDatePicker
              v-model="formData.endTime"
              class="!w-full"
              placeholder="请选择结束日期"
              type="datetime"
              value-format="x"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="出差天数">
            <ElInput :model-value="days" disabled placeholder="自动计算">
              <template #append>天</template>
            </ElInput>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="同行人" prop="companion">
            <ElInput v-model="formData.companion" placeholder="请输入同行人" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="预计费用" prop="estimatedPrice">
            <ElInputNumber
              v-model="formData.estimatedPrice"
              class="!w-full"
              controls-position="right"
              :min="0"
              :precision="2"
              placeholder="请输入预计费用"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElFormItem label="备注" prop="remark">
        <ElInput
          v-model="formData.remark"
          :rows="2"
          placeholder="请输入备注"
          type="textarea"
        />
      </ElFormItem>
      <ElFormItem label="附件" prop="fileUrls">
        <FileUpload
          v-model="formData.fileUrls"
          :max-number="5"
          :max-size="5"
          multiple
        />
      </ElFormItem>

      <div class="mb-3 mt-5 flex items-center justify-between">
        <span class="font-bold">行程明细</span>
        <ElButton plain type="primary" @click="addItem">添加行程</ElButton>
      </div>
      <ItemGrid class="w-full">
        <template #departureAreaId="{ row }">
          <AreaCascader
            v-model="row.departureAreaId"
            check-strictly
            class="!w-full"
            clearable
            placeholder="请选择出发城市"
          />
        </template>
        <template #arrivalAreaId="{ row }">
          <AreaCascader
            v-model="row.arrivalAreaId"
            check-strictly
            class="!w-full"
            clearable
            placeholder="请选择到达城市"
          />
        </template>
        <template #startTime="{ row }">
          <ElDatePicker
            v-model="row.startTime"
            class="!w-full"
            placeholder="请选择开始日期"
            type="date"
            value-format="x"
          />
        </template>
        <template #endTime="{ row }">
          <ElDatePicker
            v-model="row.endTime"
            class="!w-full"
            placeholder="请选择结束日期"
            type="date"
            value-format="x"
          />
        </template>
        <template #transportType="{ row }">
          <ElSelect
            v-model="row.transportType"
            class="!w-full"
            clearable
            placeholder="请选择交通方式"
          >
            <ElOption
              v-for="item in getDictOptions(DICT_TYPE.OA_TRANSPORT_TYPE, 'number')"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </template>
        <template #remark="{ row }">
          <ElInput v-model="row.remark" placeholder="请输入备注" />
        </template>
        <template #itemActions="{ rowIndex }">
          <ElButton link type="danger" @click="deleteItem(rowIndex)">
            删除
          </ElButton>
        </template>
      </ItemGrid>
    </ElForm>
  </Modal>
</template>
