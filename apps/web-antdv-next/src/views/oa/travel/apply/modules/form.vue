<script lang="ts" setup>
import type { Rule } from 'antdv-next';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaTravelApplyApi } from '#/api/oa/travel/apply';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { fromTimestampPickerValue, toTimestampPickerValue } from '@vben/utils';

import {
  Button,
  Col,
  DatePicker,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  TextArea,
} from 'antdv-next';
import dayjs from 'dayjs';

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
const formRules = reactive<Record<string, Rule[]>>({
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
      message.warning('请添加行程明细');
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
      message.success($t('ui.actionMessage.operationSuccess'));
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
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      :label-col="{ style: { width: '100px' } }"
    >
      <FormItem label="出差事由" name="reason">
        <TextArea
          v-model:value="formData.reason"
          :rows="2"
          placeholder="请输入出差事由"
        />
      </FormItem>
      <Row :gutter="20">
        <Col :span="9">
          <FormItem label="开始日期" name="startTime">
            <DatePicker
              :value="toTimestampPickerValue(formData.startTime)"
              class="w-full"
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择开始日期"
              show-time
              value-format="x"
              @update:value="
                formData.startTime = fromTimestampPickerValue($event)
              "
            />
          </FormItem>
        </Col>
        <Col :span="9">
          <FormItem label="结束日期" name="endTime">
            <DatePicker
              :value="toTimestampPickerValue(formData.endTime)"
              class="w-full"
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择结束日期"
              show-time
              value-format="x"
              @update:value="formData.endTime = fromTimestampPickerValue($event)"
            />
          </FormItem>
        </Col>
        <Col :span="6">
          <FormItem label="出差天数">
            <Input :value="days" addon-after="天" disabled placeholder="自动计算" />
          </FormItem>
        </Col>
      </Row>
      <Row :gutter="20">
        <Col :span="12">
          <FormItem label="同行人" name="companion">
            <Input v-model:value="formData.companion" placeholder="请输入同行人" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="预计费用" name="estimatedPrice">
            <InputNumber
              v-model:value="formData.estimatedPrice"
              class="w-full"
              :min="0"
              :precision="2"
              placeholder="请输入预计费用"
            />
          </FormItem>
        </Col>
      </Row>
      <FormItem label="备注" name="remark">
        <TextArea
          v-model:value="formData.remark"
          :rows="2"
          placeholder="请输入备注"
        />
      </FormItem>
      <FormItem label="附件" name="fileUrls">
        <FileUpload
          v-model="formData.fileUrls"
          :max-number="5"
          :max-size="5"
          multiple
        />
      </FormItem>

      <div class="mb-3 mt-5 flex items-center justify-between">
        <span class="font-bold">行程明细</span>
        <Button type="primary" ghost @click="addItem">添加行程</Button>
      </div>
      <ItemGrid class="w-full">
        <template #departureAreaId="{ row }">
          <AreaCascader
            v-model="row.departureAreaId"
            allow-clear
            change-on-select
            class="w-full"
            placeholder="请选择出发城市"
          />
        </template>
        <template #arrivalAreaId="{ row }">
          <AreaCascader
            v-model="row.arrivalAreaId"
            allow-clear
            change-on-select
            class="w-full"
            placeholder="请选择到达城市"
          />
        </template>
        <template #startTime="{ row }">
          <DatePicker
            :value="toTimestampPickerValue(row.startTime)"
            class="w-full"
            placeholder="请选择开始日期"
            value-format="x"
            @update:value="row.startTime = fromTimestampPickerValue($event)"
          />
        </template>
        <template #endTime="{ row }">
          <DatePicker
            :value="toTimestampPickerValue(row.endTime)"
            class="w-full"
            placeholder="请选择结束日期"
            value-format="x"
            @update:value="row.endTime = fromTimestampPickerValue($event)"
          />
        </template>
        <template #transportType="{ row }">
          <Select
            v-model:value="row.transportType"
            allow-clear
            class="w-full"
            :options="getDictOptions(DICT_TYPE.OA_TRANSPORT_TYPE, 'number')"
            placeholder="请选择交通方式"
          />
        </template>
        <template #remark="{ row }">
          <Input v-model:value="row.remark" placeholder="请输入备注" />
        </template>
        <template #itemActions="{ rowIndex }">
          <Button danger type="link" @click="deleteItem(rowIndex)">删除</Button>
        </template>
      </ItemGrid>
    </Form>
  </Modal>
</template>
