<script lang="ts" setup>
import type { FmsClosingSchemeApi } from '#/api/fms/closing/scheme';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

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

const modalData = ref<SpecialClosingSettingsFormData>(); // 弹窗数据
const subjectRules = ref<FmsClosingSchemeApi.SubjectRule[]>([]); // 凭证分录规则

const getTitle = computed(() => `编辑${modalData.value?.scheme.name ?? '专用结转'}`);

// 金额比例校验提示
const ratioTip = computed(() =>
  modalData.value?.scheme.type === FMS_CLOSING_TYPE.UNPAID_VAT
    ? '转出未交增值税的借方和贷方比例必须分别等于 100%'
    : '借方和贷方比例必须相等，该比例同时作为本方案的计提税率',
);

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
      ElMessage.warning(ruleError);
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
      ElMessage.success('保存成功');
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
    subjectRules.value = data.scheme.subjects.map((item) => ({ ...item }));
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
  });
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
      <ElButton link type="primary" @click="addSubjectRule()">
        <IconifyIcon class="mr-1" icon="lucide:plus" />添加分录
      </ElButton>
    </div>
    <ElTable :data="subjectRules" border max-height="420">
      <ElTableColumn label="摘要" min-width="180">
        <template #default="{ row }">
          <ElInput v-model="row.digest" placeholder="请输入摘要" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="借/贷" width="105">
        <template #default="{ row }">
          <ElSelect v-model="row.direction">
            <ElOption label="借" :value="FMS_DEBIT_CREDIT_DIRECTION.DEBIT" />
            <ElOption label="贷" :value="FMS_DEBIT_CREDIT_DIRECTION.CREDIT" />
          </ElSelect>
        </template>
      </ElTableColumn>
      <ElTableColumn label="科目" min-width="280">
        <template #default="{ row }">
          <FmsSubjectSelect
            v-model="row.subjectId"
            :options="modalData?.subjects || []"
            class="!w-full"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="金额比例%" width="130">
        <template #default="{ row }">
          <ElInputNumber
            v-model="row.amountRatio"
            :controls="false"
            :max="100"
            :min="0.01"
            :precision="2"
            class="!w-full"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="操作" width="70">
        <template #default="{ $index }">
          <ElButton
            link
            type="danger"
            @click="subjectRules.splice($index, 1)"
          >
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <div class="mt-2.5 text-sm text-muted-foreground">{{ ratioTip }}</div>
  </Modal>
</template>
