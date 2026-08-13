<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { FmsClosingTemplateApi } from '#/api/fms/closing/template';
import type { FmsSubjectApi } from '#/api/fms/config/subject';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Input, InputNumber, message, Select, Table } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createClosingTemplate,
  updateClosingTemplate,
} from '#/api/fms/closing/template';
import FmsSubjectSelect from '#/views/fms/config/subject/components/subject-select.vue';
import {
  FMS_CLOSING_TEMPLATE_CATEGORY,
  FMS_DEBIT_CREDIT_DIRECTION,
} from '#/views/fms/utils/constants';

import { useTemplateFormSchema } from '../data';

defineOptions({ name: 'FmsClosingTemplateForm' });

const emit = defineEmits(['success']);

/** 弹窗数据 */
interface TemplateFormData {
  accountSetId: number; // 账套编号
  subjects: FmsSubjectApi.Subject[]; // 末级科目列表
  category?: number; // 新增时的模板分类
  template?: FmsClosingTemplateApi.ClosingTemplate; // 编辑的结账模板
}

/** 凭证分录规则行 */
interface SubjectRuleRow extends FmsClosingTemplateApi.SubjectRule {
  rowKey: number; // 行标识
}

const modalData = ref<TemplateFormData>(); // 弹窗数据
const subjectRules = ref<SubjectRuleRow[]>([]); // 凭证分录规则
let ruleKeySeed = 0; // 分录规则行标识种子

const getTitle = computed(() =>
  modalData.value?.template?.id ? '编辑结账模板' : '新增结账模板',
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
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
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
    const template = modalData.value.template;
    const values = await formApi.getValues();
    const data: FmsClosingTemplateApi.ClosingTemplate = {
      id: template?.id,
      accountSetId: modalData.value.accountSetId,
      presetCode: template?.presetCode,
      name: values.name,
      category: values.category,
      periodEnd: values.periodEnd ?? true,
      subjectId: values.subjectId,
      formulaRule: values.formulaRule,
      timeType: values.timeType,
      subjects: subjectRules.value.map(
        ({ digest, direction, amountRatio, subjectId, subjectCode }) => ({
          digest,
          direction,
          amountRatio,
          subjectId,
          subjectCode,
        }),
      ),
      sort: values.sort,
    };
    modalApi.lock();
    try {
      if (data.id) {
        await updateClosingTemplate(data);
        message.success('修改成功');
      } else {
        await createClosingTemplate(data);
        message.success('新增成功');
      }
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
    const data = modalApi.getData<TemplateFormData>();
    if (!data) return;
    modalData.value = data;
    subjectRules.value = [];
    await formApi.setState({ schema: useTemplateFormSchema(data.subjects) });

    // 回显模板，否则使用默认值
    const template = data.template;
    if (template) {
      subjectRules.value = template.subjects.map((item) => ({
        ...item,
        rowKey: ++ruleKeySeed,
      }));
    } else {
      await addSubjectRule(FMS_DEBIT_CREDIT_DIRECTION.DEBIT);
      await addSubjectRule(FMS_DEBIT_CREDIT_DIRECTION.CREDIT);
    }
    await formApi.setValues({
      name: template?.name ?? '',
      category:
        template?.category ??
        data.category ??
        FMS_CLOSING_TEMPLATE_CATEGORY.DAILY_EXPENSE,
      sort: template?.sort ?? 0,
      subjectId: template?.subjectId,
      formulaRule: template?.formulaRule,
      timeType: template?.timeType,
      periodEnd: template?.periodEnd ?? true,
    });
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
  if (Math.abs(debitRatio - 100) > 0.001 || Math.abs(creditRatio - 100) > 0.001) {
    return '借方和贷方的金额比例需要分别等于 100%';
  }
  return '';
}
</script>

<template>
  <Modal :title="getTitle" class="w-[920px]">
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
      :scroll="{ y: 360 }"
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
  </Modal>
</template>
