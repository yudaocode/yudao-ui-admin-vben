<script lang="ts" setup>
import type { Rule } from 'antdv-next';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaTravelApplyApi } from '#/api/oa/travel/apply';
import type { OaTravelReimbursementApi } from '#/api/oa/travel/reimbursement';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
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
  createTravelReimbursement,
  getTravelReimbursement,
  updateTravelReimbursement,
} from '#/api/oa/travel/reimbursement';
import { FileUpload } from '#/components/upload';
import { $t } from '#/locales';
import ApplySelectModal from '#/views/oa/travel/apply/components/select-modal.vue';

import { useItemGridColumns } from '../data';

defineOptions({ name: 'OaTravelReimbursementForm' });

const emit = defineEmits(['success']);

const formRef = ref();
const formLoading = ref(false); // 表单加载及保存状态
const formData = ref<OaTravelReimbursementApi.TravelReimbursement>(
  createDefaultFormData(),
); // 单据
const formRules = reactive<Record<string, Rule[]>>({
  reason: [{ required: true, message: '出差事由不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始日期不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '结束日期不能为空', trigger: 'change' }],
  fileUrls: [
    { type: 'array', required: true, message: '请上传报销附件', trigger: 'change' },
  ],
});

const getTitle = computed(() => {
  return formData.value.id
    ? $t('ui.actionTitle.edit', ['差旅报销'])
    : $t('ui.actionTitle.create', ['差旅报销']);
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

/** 报销总金额，最终以服务端计算结果为准 */
const totalPrice = computed(() =>
  (
    formData.value.items.reduce(
      (sum, item) => sum + Math.round((item.price || 0) * 100),
      0,
    ) / 100
  ).toFixed(2),
);

const [ApplySelect, applySelectModalApi] = useVbenModal({
  connectedComponent: ApplySelectModal,
  destroyOnClose: true,
});

/** 打开关联出差申请选择弹窗 */
function openApplySelect() {
  applySelectModalApi.setData({ id: formData.value.travelApplyId }).open();
}

/** 选择关联单据，仅带入事由及出差日期，仍允许独立修改 */
function handleApplySelect(apply: OaTravelApplyApi.TravelApply) {
  formData.value.travelApplyId = apply.id;
  formData.value.travelApplyNo = apply.no;
  formData.value.reason = apply.reason;
  formData.value.startTime = apply.startTime;
  formData.value.endTime = apply.endTime;
}

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
    showFooter: true,
    footerMethod({ columns }) {
      // 费用表合计，与单据头部使用同一金额
      return [
        columns.map((column, index) =>
          index === 0 ? '合计' : column.field === 'price' ? totalPrice.value : '',
        ),
      ];
    },
  } as VxeTableGridOptions<OaTravelReimbursementApi.TravelReimbursementItem>,
});

/** 新增费用明细 */
async function addItem() {
  formData.value.items.push({});
  await reloadItems();
}

/** 删除费用明细 */
async function deleteItem(index: number) {
  formData.value.items.splice(index, 1);
  await reloadItems();
}

/** 刷新费用明细表格 */
async function reloadItems() {
  await nextTick();
  await itemGridApi.grid?.reloadData(formData.value.items);
}

/** 构造默认单据 */
function createDefaultFormData(): OaTravelReimbursementApi.TravelReimbursement {
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
      message.warning('请添加费用明细');
      return;
    }
    if (
      formData.value.items.some(
        (item) => item.price === undefined || item.price === null,
      )
    ) {
      message.warning('请填写每行费用金额');
      return;
    }
    // 2. 保存单据，审批由列表发起
    modalApi.lock();
    formLoading.value = true;
    try {
      if (formData.value.id) {
        await updateTravelReimbursement(formData.value);
      } else {
        formData.value.id = await createTravelReimbursement(formData.value);
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
      formData.value = await getTravelReimbursement(data.id);
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
      <Row :gutter="20">
        <Col :span="6">
          <FormItem label="关联出差申请" name="travelApplyId">
            <Input
              :value="formData.travelApplyNo"
              placeholder="请选择出差申请单（可选）"
              readonly
              @click="openApplySelect"
            >
              <template #suffix>
                <IconifyIcon class="size-4" icon="lucide:search" />
              </template>
            </Input>
          </FormItem>
        </Col>
      </Row>
      <FormItem label="出差事由" name="reason">
        <TextArea
          v-model:value="formData.reason"
          :rows="2"
          placeholder="请输入出差事由"
        />
      </FormItem>
      <Row :gutter="20">
        <Col :span="12">
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
        <Col :span="12">
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
        <Col :span="12">
          <FormItem label="出差天数">
            <Input :value="days" addon-after="天" disabled placeholder="自动计算" />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="报销总金额">
            <Input
              :value="totalPrice"
              addon-after="元"
              disabled
              placeholder="自动汇总"
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
        <span class="font-bold">费用明细</span>
        <Button type="primary" ghost @click="addItem">添加费用</Button>
      </div>
      <ItemGrid class="w-full">
        <template #priceHeader>
          <span class="mr-1 text-red-500">*</span>
          金额(元)
        </template>
        <template #expenseType="{ row }">
          <Select
            v-model:value="row.expenseType"
            allow-clear
            class="w-full"
            :options="getDictOptions(DICT_TYPE.OA_EXPENSE_TYPE, 'number')"
            placeholder="请选择费用类型"
          />
        </template>
        <template #expenseTime="{ row }">
          <DatePicker
            :value="toTimestampPickerValue(row.expenseTime)"
            class="w-full"
            placeholder="请选择发生日期"
            value-format="x"
            @update:value="row.expenseTime = fromTimestampPickerValue($event)"
          />
        </template>
        <template #departureCity="{ row }">
          <Input v-model:value="row.departureCity" placeholder="请输入出发地" />
        </template>
        <template #arrivalCity="{ row }">
          <Input v-model:value="row.arrivalCity" placeholder="请输入到达地" />
        </template>
        <template #price="{ row }">
          <InputNumber
            v-model:value="row.price"
            class="w-full"
            :min="0"
            :precision="2"
          />
        </template>
        <template #description="{ row }">
          <Input v-model:value="row.description" placeholder="请输入费用说明" />
        </template>
        <template #itemActions="{ rowIndex }">
          <Button danger type="link" @click="deleteItem(rowIndex)">删除</Button>
        </template>
      </ItemGrid>
    </Form>

    <ApplySelect @select="handleApplySelect" />
  </Modal>
</template>
