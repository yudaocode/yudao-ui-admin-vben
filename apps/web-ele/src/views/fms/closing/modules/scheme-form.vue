<script lang="ts" setup>
import type { FmsClosingSchemeApi } from '#/api/fms/closing/scheme';
import type { FmsClosingTemplateApi } from '#/api/fms/closing/template';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
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
import {
  createClosingScheme,
  deleteClosingScheme,
  updateClosingScheme,
} from '#/api/fms/closing/scheme';
import FmsSubjectSelect from '#/views/fms/config/subject/components/subject-select.vue';
import {
  FMS_CLOSING_TIME_TYPE,
  FMS_DEBIT_CREDIT_DIRECTION,
  FMS_FORMULA_RULE,
} from '#/views/fms/utils/constants';

import { useSchemeFormSchema } from '../data';

defineOptions({ name: 'FmsClosingSchemeForm' });

const emit = defineEmits(['success']);

/** 弹窗数据 */
interface SchemeFormData {
  accountSetId: number; // 账套编号
  subjects: FmsSubjectApi.Subject[]; // 末级科目列表
  voucherWords: FmsVoucherWordApi.VoucherWord[]; // 凭证字列表
  scheme?: FmsClosingSchemeApi.ClosingScheme; // 编辑的结账方案
  template?: FmsClosingTemplateApi.ClosingTemplate; // 选用的结账模板
}

const modalData = ref<SchemeFormData>(); // 弹窗数据
const submitting = ref(false); // 表单的提交中
const schemeId = ref<number>(); // 编辑的方案编号
const subjectRules = ref<FmsClosingSchemeApi.SubjectRule[]>([]); // 凭证分录规则

const getTitle = computed(() =>
  schemeId.value ? '编辑期末结转方案' : '新增期末结转方案',
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      modalData.value = undefined;
      schemeId.value = undefined;
      subjectRules.value = [];
      return;
    }
    const data = modalApi.getData<SchemeFormData>();
    if (!data) return;
    modalData.value = data;
    schemeId.value = undefined;
    subjectRules.value = [];
    await formApi.setState({
      schema: useSchemeFormSchema(data.subjects, data.voucherWords),
    });

    // 回显方案或模板，否则使用默认值
    const defaultVoucherWordId =
      data.voucherWords.find((item) => item.defaultStatus)?.id ||
      data.voucherWords[0]?.id;
    if (data.scheme) {
      schemeId.value = data.scheme.id;
      subjectRules.value = data.scheme.subjects.map((item) => ({ ...item }));
      await formApi.setValues({
        name: data.scheme.name,
        periodEnd: data.scheme.periodEnd,
        subjectId: data.scheme.subjectId,
        formulaRule: data.scheme.formulaRule,
        timeType: data.scheme.timeType,
        voucherWordId: data.scheme.voucherWordId,
      });
    } else if (data.template) {
      subjectRules.value = data.template.subjects.map((item) => ({ ...item }));
      await formApi.setValues({
        name: data.template.name,
        periodEnd: data.template.periodEnd,
        subjectId: data.template.subjectId,
        formulaRule: data.template.formulaRule ?? FMS_FORMULA_RULE.BALANCE,
        timeType: data.template.timeType ?? FMS_CLOSING_TIME_TYPE.PERIOD_END,
        voucherWordId: defaultVoucherWordId,
      });
    } else {
      await formApi.setValues({
        name: '',
        periodEnd: true,
        subjectId: undefined,
        formulaRule: FMS_FORMULA_RULE.BALANCE,
        timeType: FMS_CLOSING_TIME_TYPE.PERIOD_END,
        voucherWordId: defaultVoucherWordId,
      });
      await addSubjectRule(FMS_DEBIT_CREDIT_DIRECTION.DEBIT);
      await addSubjectRule(FMS_DEBIT_CREDIT_DIRECTION.CREDIT);
    }
  },
});

/** 添加凭证分录规则 */
async function addSubjectRule(
  direction: number = FMS_DEBIT_CREDIT_DIRECTION.DEBIT,
) {
  const values = await formApi.getValues();
  subjectRules.value.push({
    subjectId: undefined,
    digest: values.name || '期末结转',
    direction,
    amountRatio: 100,
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
  if (Math.abs(debitRatio - 100) > 0.001 || Math.abs(creditRatio - 100) > 0.001) {
    return '借方和贷方的金额比例需要分别等于 100%';
  }
  return '';
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid || !modalData.value) return;
  const ruleError = validateSubjectRules();
  if (ruleError) {
    ElMessage.warning(ruleError);
    return;
  }
  const values = await formApi.getValues();
  const data: FmsClosingSchemeApi.SaveReq = {
    id: schemeId.value,
    accountSetId: modalData.value.accountSetId,
    name: values.name,
    periodEnd: values.periodEnd ?? true,
    subjectId: values.subjectId,
    formulaRule: values.formulaRule,
    timeType: values.timeType,
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
  submitting.value = true;
  try {
    if (data.id) {
      await updateClosingScheme(data);
      ElMessage.success('修改成功');
    } else {
      await createClosingScheme(data);
      ElMessage.success('创建成功');
    }
    await modalApi.close();
    emit('success');
  } finally {
    submitting.value = false;
  }
}

/** 删除结账方案 */
async function handleDelete() {
  if (!schemeId.value || !modalData.value) return;
  try {
    await confirm('确认删除该结账方案吗？');
  } catch {
    return;
  }
  await deleteClosingScheme(modalData.value.accountSetId, schemeId.value);
  ElMessage.success('删除成功');
  await modalApi.close();
  emit('success');
}
</script>

<template>
  <Modal :title="getTitle" class="w-[920px]">
    <Form class="mx-4" />

    <!-- 凭证分录规则 -->
    <div class="mb-2.5 flex items-center justify-between">
      <span class="font-semibold">凭证分录规则</span>
      <ElButton link type="primary" @click="addSubjectRule()">
        <IconifyIcon class="mr-1" icon="lucide:plus" />添加分录
      </ElButton>
    </div>
    <ElTable :data="subjectRules" border max-height="360">
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
    <div class="mt-2.5 text-sm text-muted-foreground">
      借方和贷方的金额比例需要分别等于 100%，科目规则随方案保存为 JSON
    </div>

    <template #footer>
      <div class="flex justify-between">
        <ElButton v-if="schemeId" link type="danger" @click="handleDelete">
          删除方案
        </ElButton>
        <span v-else></span>
        <div class="flex gap-2">
          <ElButton type="primary" :loading="submitting" @click="handleSubmit">
            确定
          </ElButton>
          <ElButton @click="modalApi.close()">取消</ElButton>
        </div>
      </div>
    </template>
  </Modal>
</template>
