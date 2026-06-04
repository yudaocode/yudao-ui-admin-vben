<script lang="ts" setup>
import type { FormType } from './data';

import type { MesQcIndicatorResultApi } from '#/api/mes/qc/indicatorresult';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesQcResultValueType } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createIndicatorResult,
  getIndicatorResultDetail,
  updateIndicatorResult,
} from '#/api/mes/qc/indicatorresult';
import { $t } from '#/locales';

import { useQcIndicatorResultFormSchema } from './data';

interface CtxData {
  formType: FormType;
  id?: number;
  qcId: number;
  qcType: number;
}

defineOptions({ name: 'QcIndicatorResultForm' });

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const items = ref<MesQcIndicatorResultApi.IndicatorResultDetail[]>([]);
const ctxData = ref<CtxData>();

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
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

/** 获取字典选项（valueSpecification 为系统字典类型名） */
function getValueOptions(dictType?: string) {
  return dictType
    ? getDictOptions(dictType, 'string').map(({ label, value }) => ({
        label,
        value: String(value),
      }))
    : [];
}

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
    // 提交表单
    const head =
      (await formApi.getValues()) as MesQcIndicatorResultApi.IndicatorResult;
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
      items: submitItems,
      qcId: ctxData.value.qcId,
      qcType: ctxData.value.qcType,
    };
    try {
      if (formType.value === 'update') {
        await updateIndicatorResult(payload);
        ElMessage.success($t('common.updateSuccess'));
      } else {
        await createIndicatorResult(payload);
        ElMessage.success($t('common.createSuccess'));
      }
      // 关闭并提示
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
    formApi.setState({ schema: useQcIndicatorResultFormSchema(formApi) });
    // 加载数据
    const data = modalApi.getData<CtxData>();
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
      // 设置到 values
      await formApi.setValues({
        id: detail.id,
        code: detail.code,
        remark: detail.remark,
        sn: detail.sn,
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
      <ElDivider>检测值</ElDivider>
      <!-- 检测值控件由每行 valueType 驱动，逐行渲染：FLOAT/INTEGER 走 ElInputNumber，DICT 走 ElSelect 并按 valueSpecification 解析选项 -->
      <ElForm label-width="120px">
        <div
          v-for="(item, index) in items"
          :key="item.indicatorId ?? index"
          class="mb-2"
        >
          <ElFormItem
            :label="`检测项${index + 1}：${item.indicatorName ?? ''}`"
          >
            <ElInputNumber
              v-if="
                item.valueType === MesQcResultValueType.FLOAT ||
                item.valueType === MesQcResultValueType.INTEGER
              "
              v-model="item.valueNumber"
              class="!w-full"
              controls-position="right"
              :precision="
                item.valueType === MesQcResultValueType.FLOAT ? 4 : 0
              "
              placeholder="请输入"
            />
            <ElInput
              v-else-if="item.valueType === MesQcResultValueType.TEXT"
              v-model="item.value"
              :rows="2"
              type="textarea"
              placeholder="请输入检测值"
            />
            <ElSelect
              v-else-if="item.valueType === MesQcResultValueType.DICT"
              v-model="item.value"
              clearable
              class="!w-full"
              placeholder="请选择"
            >
              <ElOption
                v-for="opt in getValueOptions(item.valueSpecification)"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <ElInput
              v-else-if="item.valueType === MesQcResultValueType.FILE"
              v-model="item.value"
              placeholder="请输入文件地址"
            />
            <ElInput v-else v-model="item.value" placeholder="请输入" />
          </ElFormItem>
        </div>
      </ElForm>
    </div>
  </Modal>
</template>
