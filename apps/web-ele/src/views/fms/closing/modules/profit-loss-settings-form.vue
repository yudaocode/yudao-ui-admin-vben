<script lang="ts" setup>
import type { FmsClosingSchemeApi } from '#/api/fms/closing/scheme';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';
import { ElCheckbox, ElMessage, ElTooltip } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { saveProfitLossSettings } from '#/api/fms/closing/scheme';
import {
  FMS_CLOSING_VOUCHER_TYPE,
  FMS_SUBJECT_TYPE,
} from '#/views/fms/utils/constants';

import { useProfitLossSettingsFormSchema } from '../data';

defineOptions({ name: 'FmsProfitLossSettingsForm' });

const emit = defineEmits(['success']);

/** 弹窗数据 */
interface ProfitLossSettingsFormData {
  accountSetId: number; // 账套编号
  month: string; // 会计期间
  subjects: FmsSubjectApi.Subject[]; // 末级科目列表
  voucherWords: FmsVoucherWordApi.VoucherWord[]; // 凭证字列表
  settings?: FmsClosingSchemeApi.ClosingScheme; // 已保存的结转损益设置
}

const modalData = ref<ProfitLossSettingsFormData>(); // 弹窗数据

// 损益类科目列表
const profitLossSubjects = computed(
  () =>
    modalData.value?.subjects.filter(
      (item) => item.type === FMS_SUBJECT_TYPE.PROFIT_LOSS,
    ) || [],
);
// 非损益类科目列表
const closingSubjects = computed(
  () =>
    modalData.value?.subjects.filter(
      (item) => item.type !== FMS_SUBJECT_TYPE.PROFIT_LOSS,
    ) || [],
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 230,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || !modalData.value) return;
    const values = await formApi.getValues();
    const data: FmsClosingSchemeApi.ProfitLossSettings = {
      accountSetId: modalData.value.accountSetId,
      voucherWordId: values.voucherWordId,
      digest: values.digest,
      voucherType: values.voucherType,
      priorYearAdjustmentSubjectId: values.priorYearAdjustmentSubjectId,
      adjustmentClosingSubjectId: values.adjustmentClosingSubjectId,
      otherClosingSubjectId: values.otherClosingSubjectId,
      reverseBalance: values.reverseBalance ?? true,
      closingDay: dayjs(values.voucherDate).date(),
    };
    modalApi.lock();
    try {
      await saveProfitLossSettings(data);
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
      return;
    }
    const data = modalApi.getData<ProfitLossSettingsFormData>();
    if (!data) return;
    modalData.value = data;
    await formApi.setState({
      schema: useProfitLossSettingsFormSchema(
        data.month,
        profitLossSubjects.value,
        closingSubjects.value,
        data.voucherWords,
      ),
    });

    // 按科目编码预填默认科目，再回显已保存的设置
    const subjects = data.subjects;
    const settings = data.settings;
    const legacySettings = settings ? !settings.priorYearAdjustmentSubjectId : false;
    const values = {
      voucherWordId:
        settings?.voucherWordId ||
        data.voucherWords.find((item) => item.defaultStatus)?.id ||
        data.voucherWords[0]?.id,
      digest: settings?.digest || '结转损益',
      voucherType:
        settings?.voucherType ?? FMS_CLOSING_VOUCHER_TYPE.COMBINED_GAIN_AND_LOSS,
      priorYearAdjustmentSubjectId:
        settings?.priorYearAdjustmentSubjectId ||
        subjects.find((item) => item.code === '6000')?.id,
      adjustmentClosingSubjectId:
        settings?.adjustmentClosingSubjectId ||
        subjects.find((item) => item.code === '310415')?.id,
      otherClosingSubjectId:
        settings?.otherClosingSubjectId ||
        subjects.find((item) => item.code === '3103')?.id,
      reverseBalance: legacySettings
        ? true
        : (settings?.reverseBalance ?? true),
    };
    const closingDay = Math.min(
      settings?.closingDay || 31,
      dayjs(`${data.month}-01`).daysInMonth(),
    );
    await formApi.setValues({
      ...values,
      voucherDate: dayjs(
        `${data.month}-${String(closingDay).padStart(2, '0')}`,
      ).format('YYYY-MM-DD'),
    });
  },
});
</script>

<template>
  <Modal title="结转损益参数设置" class="w-[680px]">
    <Form class="mx-4">
      <template #reverseBalance="slotProps">
        <ElCheckbox
          :model-value="!!slotProps.componentField.modelValue"
          @update:model-value="
            (checked) =>
              slotProps.componentField['onUpdate:modelValue'](checked)
          "
        >
          结转方式：按余额反向结转
          <ElTooltip placement="top">
            <template #content>
              选中时按科目实际余额的相反方向结转<br />
              未选中时按科目属性中定义的余额方向反向结转
            </template>
            <IconifyIcon class="ml-1" icon="lucide:circle-help" />
          </ElTooltip>
        </ElCheckbox>
      </template>
    </Form>
  </Modal>
</template>
