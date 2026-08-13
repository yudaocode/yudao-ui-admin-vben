<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { FmsClosingSchemeApi } from '#/api/fms/closing/scheme';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Input, InputNumber, message, Select, Table } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { updateSpecialClosingSettings } from '#/api/fms/closing/scheme';
import FmsSubjectSelect from '#/views/fms/config/subject/components/subject-select.vue';
import {
  FMS_CLOSING_TYPE,
  FMS_DEBIT_CREDIT_DIRECTION,
} from '#/views/fms/utils/constants';

import { useSpecialClosingSettingsFormSchema } from '../data';

defineOptions({ name: 'FmsSpecialClosingSettingsForm' });

const emit = defineEmits(['success']);

/** 弹窗数据 */
interface SpecialClosingSettingsFormData {
  accountSetId: number; // 账套编号
  subjects: FmsSubjectApi.Subject[]; // 末级科目列表
  voucherWords: FmsVoucherWordApi.VoucherWord[]; // 凭证字列表
  scheme: FmsClosingSchemeApi.ClosingScheme; // 专用结转方案
}

/** 凭证分录规则行 */
interface SubjectRuleRow extends FmsClosingSchemeApi.SubjectRule {
  rowKey: number; // 行标识
}

const modalData = ref<SpecialClosingSettingsFormData>(); // 弹窗数据
const subjectRules = ref<SubjectRuleRow[]>([]); // 凭证分录规则
let ruleKeySeed = 0; // 分录规则行标识种子

const getTitle = computed(() => `编辑${modalData.value?.scheme.name ?? '专用结转'}`);

// 金额比例校验提示
const ratioTip = computed(() =>
  modalData.value?.scheme.type === FMS_CLOSING_TYPE.UNPAID_VAT
    ? '转出未交增值税的借方和贷方比例必须分别等于 100%'
    : '借方和贷方比例必须相等，该比例同时作为本方案的计提税率',
);

// 借贷方向选项
const directionOptions = [
  { label: '借', value: FMS_DEBIT_CREDIT_DIRECTION.DEBIT },
  { label: '贷', value: FMS_DEBIT_CREDIT_DIRECTION.CREDIT },
];

// 凭证分录规则列
const ruleColumns: TableColumnsType = [
  { title: '摘要', dataIndex: 'digest', minWidth: 180 },
  { title: '借/贷', dataIndex: 'direction', width: 105 },
  { title: '科目', dataIndex: 'subjectId', minWidth: 280 },
  { title: '金额比例%', dataIndex: 'amountRatio', width: 130 },
  { title: '操作', key: 'action', align: 'center', width: 70 },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || !modalData.value) return;
    const ruleError = validateSubjectRules();
    if (ruleError) {
      message.warning(ruleError);
      return;
    }
    const values = await formApi.getValues();
    const data: FmsClosingSchemeApi.SpecialClosingSettings = {
      id: modalData.value.scheme.id,
      accountSetId: modalData.value.accountSetId,
      voucherWordId: values.voucherWordId,
      subjects: subjectRules.value.map(
        ({ digest, direction, amountRatio, subjectId, subjectCode }) => ({
          digest,
          direction,
          amountRatio,
          subjectId,
          subjectCode,
        }),
      ),
    };
    modalApi.lock();
    try {
      await updateSpecialClosingSettings(data);
      message.success('保存成功');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      modalData.value = undefined;
      subjectRules.value = [];
      return;
    }
    const data = modalApi.getData<SpecialClosingSettingsFormData>();
    if (!data) return;
    modalData.value = data;
    subjectRules.value = data.scheme.subjects.map((item) => ({
      ...item,
      rowKey: ++ruleKeySeed,
    }));
    await formApi.setState({
      schema: useSpecialClosingSettingsFormSchema(data.voucherWords),
    });
    await formApi.setValues({
      voucherWordId: data.scheme.voucherWordId,
    });
  },
});

/** 添加凭证分录规则 */
function addSubjectRule(direction: number = FMS_DEBIT_CREDIT_DIRECTION.DEBIT) {
  if (!modalData.value) return;
  subjectRules.value.push({
    subjectId: undefined,
    digest: modalData.value.scheme.name,
    direction,
    amountRatio:
      modalData.value.scheme.type === FMS_CLOSING_TYPE.UNPAID_VAT ? 100 : 1,
    rowKey: ++ruleKeySeed,
  });
}

/** 删除凭证分录规则 */
function removeSubjectRule(rowKey: number) {
  subjectRules.value = subjectRules.value.filter(
    (item) => item.rowKey !== rowKey,
  );
}

/** 校验凭证分录规则，返回错误提示 */
function validateSubjectRules() {
  if (
    subjectRules.value.length < 2 ||
    subjectRules.value.some((item) => !item.digest || !item.subjectId)
  ) {
    return '请完整填写至少两条凭证分录规则';
  }
  const debitRatio = subjectRules.value
    .filter((item) => item.direction === FMS_DEBIT_CREDIT_DIRECTION.DEBIT)
    .reduce((sum, item) => sum + Number(item.amountRatio), 0);
  const creditRatio = subjectRules.value
    .filter((item) => item.direction === FMS_DEBIT_CREDIT_DIRECTION.CREDIT)
    .reduce((sum, item) => sum + Number(item.amountRatio), 0);
  if (
    debitRatio <= 0 ||
    debitRatio > 100 ||
    Math.abs(debitRatio - creditRatio) > 0.001 ||
    (modalData.value?.scheme.type === FMS_CLOSING_TYPE.UNPAID_VAT &&
      Math.abs(debitRatio - 100) > 0.001)
  ) {
    return ratioTip.value;
  }
  return '';
}
</script>

<template>
  <Modal :title="getTitle" class="w-[880px]">
    <Form class="mx-4" />

    <!-- 凭证分录规则 -->
    <div class="mb-2.5 flex items-center justify-between">
      <span class="font-semibold">凭证分录规则</span>
      <Button type="link" @click="addSubjectRule()">
        <IconifyIcon class="mr-1" icon="lucide:plus" />添加分录
      </Button>
    </div>
    <Table
      bordered
      :columns="ruleColumns"
      :data-source="subjectRules"
      :pagination="false"
      :scroll="{ y: 420 }"
      row-key="rowKey"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'digest'">
          <Input v-model:value="record.digest" placeholder="请输入摘要" />
        </template>
        <template v-else-if="column.dataIndex === 'direction'">
          <Select
            v-model:value="record.direction"
            :options="directionOptions"
            class="w-full"
          />
        </template>
        <template v-else-if="column.dataIndex === 'subjectId'">
          <FmsSubjectSelect
            v-model="record.subjectId"
            :options="modalData?.subjects || []"
          />
        </template>
        <template v-else-if="column.dataIndex === 'amountRatio'">
          <InputNumber
            v-model:value="record.amountRatio"
            :controls="false"
            :max="100"
            :min="0.01"
            :precision="2"
            class="!w-full"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            danger
            size="small"
            type="link"
            @click="removeSubjectRule(record.rowKey)"
          >
            删除
          </Button>
        </template>
      </template>
    </Table>
    <div class="mt-2.5 text-sm text-muted-foreground">{{ ratioTip }}</div>
  </Modal>
</template>
