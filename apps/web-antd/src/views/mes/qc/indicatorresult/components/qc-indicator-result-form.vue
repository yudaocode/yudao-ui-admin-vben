<script lang="ts" setup>
import type { MesQcIndicatorResultApi } from '#/api/mes/qc/indicatorresult';

import { computed, h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form as AForm,
  Button,
  Divider,
  Input,
  InputNumber,
  message,
  Select,
  Textarea,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import {
  createIndicatorResult,
  getIndicatorResultDetail,
  updateIndicatorResult,
} from '#/api/mes/qc/indicatorresult';
import { $t } from '#/locales';
import {
  MesAutoCodeRuleCode,
  MesQcResultValueType,
} from '#/views/mes/utils/constants';

interface OpenData {
  formType: 'create' | 'update';
  id?: number;
  qcId: number;
  qcType: number;
}

const emit = defineEmits(['success']);
const formType = ref<'create' | 'update'>('create');
const items = ref<MesQcIndicatorResultApi.IndicatorResultDetail[]>([]);
const ctxData = ref<OpenData>();

const getTitle = computed(() =>
  formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['检验结果'])
    : $t('ui.actionTitle.create', ['检验结果']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  // TODO @AI：搞个 data.ts？
// TODO @AI：代码风格，貌似不够一致；
  schema: [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'code',
      label: '样品编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入样品编号',
      },
      rules: 'required',
      suffix: () =>
        h(
          Button,
          {
            type: 'default',
            onClick: async () => {
              try {
                const code = await generateAutoCode(
                  MesAutoCodeRuleCode.QC_INDICATOR_RESULT_CODE,
                );
                await formApi.setFieldValue('code', code);
              } catch (error) {
                console.error(error);
              }
            },
          },
          { default: () => '生成' },
        ),
    },
    {
      fieldName: 'sn',
      label: '物资 SN',
      component: 'Input',
      componentProps: {
        placeholder: '请输入物资 SN',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ],
  showDefaultActions: false,
});

/** 解析字典选项字符串：value=label;value=label */
function parseValueOptions(spec?: string) {
  if (!spec) {
    return [];
  }
  return spec
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [value, label] = part.split('=');
      return { value: value ?? '', label: label ?? value ?? '' };
    });
}

// TODO @AI：注释风格的统一；
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!ctxData.value) {
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    try {
      const head = (await formApi.getValues()) as MesQcIndicatorResultApi.IndicatorResult;
      const submitItems = items.value.map((item) => {
        const submit: MesQcIndicatorResultApi.IndicatorResultDetail = {
          id: item.id,
          indicatorId: item.indicatorId,
          remark: item.remark,
        };
        if (
          item.valueType === MesQcResultValueType.FLOAT ||
          item.valueType === MesQcResultValueType.INTEGER
        ) {
          submit.value =
            item.valueNumber == null ? undefined : String(item.valueNumber);
        } else {
          submit.value = item.value;
        }
        return submit;
      });
      const payload: MesQcIndicatorResultApi.IndicatorResult = {
        ...head,
        qcId: ctxData.value.qcId,
        qcType: ctxData.value.qcType,
        items: submitItems,
      };
      if (formType.value === 'update') {
        await updateIndicatorResult(payload);
        message.success($t('common.updateSuccess'));
      } else {
        await createIndicatorResult(payload);
        message.success($t('common.createSuccess'));
      }
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      ctxData.value = undefined;
      items.value = [];
      return;
    }
    const data = modalApi.getData<OpenData>();
    ctxData.value = data;
    formType.value = data.formType;
    modalApi.lock();
    try {
      const detail = await getIndicatorResultDetail(
        data.qcId,
        data.qcType,
        data.id,
      );
      // 回填数值字段（用于 InputNumber 绑定）
      items.value = (detail.items ?? []).map((item) => ({
        ...item,
        valueNumber:
          (item.valueType === MesQcResultValueType.FLOAT ||
            item.valueType === MesQcResultValueType.INTEGER) &&
          item.value != null
            ? Number(item.value)
            : undefined,
      }));
      await formApi.setValues({
        id: detail.id,
        code: detail.code,
        sn: detail.sn,
        remark: detail.remark,
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <div class="px-4">
      <Form />
      <Divider>检测值</Divider>
      <!-- TODO @AI：这里，可以改成更大化使用 schema 方式么？ -->
      <AForm :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <div
          v-for="(item, index) in items"
          :key="item.indicatorId ?? index"
          class="mb-2"
        >
          <AForm.Item :label="`检测项${index + 1}：${item.indicatorName ?? ''}`">
            <InputNumber
              v-if="
                item.valueType === MesQcResultValueType.FLOAT ||
                item.valueType === MesQcResultValueType.INTEGER
              "
              v-model:value="item.valueNumber"
              :precision="item.valueType === MesQcResultValueType.FLOAT ? 4 : 0"
              class="!w-full"
              placeholder="请输入"
            />
            <Textarea
              v-else-if="item.valueType === MesQcResultValueType.TEXT"
              v-model:value="item.value"
              :rows="2"
              placeholder="请输入检测值"
            />
            <Select
              v-else-if="item.valueType === MesQcResultValueType.DICT"
              v-model:value="item.value"
              allow-clear
              :options="parseValueOptions(item.valueSpecification)"
              placeholder="请选择"
            />
            <Input
              v-else-if="item.valueType === MesQcResultValueType.FILE"
              v-model:value="item.value"
              placeholder="请输入文件地址"
            />
            <Input v-else v-model:value="item.value" placeholder="请输入" />
          </AForm.Item>
        </div>
      </AForm>
    </div>
  </Modal>
</template>
