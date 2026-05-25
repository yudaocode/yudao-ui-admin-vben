<script lang="ts" setup>
import type { Ref } from 'vue';

import type { IotProductApi } from '#/api/iot/product/product';
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { computed, inject, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  DICT_TYPE,
  IOT_PROVIDE_KEY,
  IoTDataSpecsDataTypeEnum,
  IoTThingModelTypeEnum,
} from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { $t } from '@vben/locales';
import { cloneDeep, isEmpty } from '@vben/utils';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElRadioButton,
  ElRadioGroup,
} from 'element-plus';

import {
  createThingModel,
  getThingModel,
  ThingModelFormRules,
  updateThingModel,
} from '#/api/iot/thingmodel';

import ThingModelEvent from './event.vue';
import ThingModelProperty from './property.vue';
import ThingModelService from './service.vue';

const emit = defineEmits(['success']);

const product = inject<Ref<IotProductApi.Product>>(IOT_PROVIDE_KEY.PRODUCT);

const formRef = ref();
const formData = ref<ThingModelApi.ThingModel>(buildEmptyFormData());

const getTitle = computed(() =>
  formData.value.id
    ? $t('ui.actionTitle.edit', ['物模型'])
    : $t('ui.actionTitle.create', ['物模型']),
);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = cloneDeep(formData.value);
    data.productId = product!.value.id;
    data.productKey = product!.value.productKey;
    fillExtraAttributes(data);
    try {
      await (data.id ? updateThingModel(data) : createThingModel(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 每次打开都重置；避免上一次的状态残留
    formData.value = buildEmptyFormData();
    formRef.value?.clearValidate?.();
    // 加载数据
    const data = modalApi.getData<{ id?: number }>();
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      const result = await getThingModel(data.id);
      // 设置到 values
      formData.value = normalizeFormData(result);
    } finally {
      modalApi.unlock();
    }
  },
});

/** 构造空白表单数据 */
function buildEmptyFormData(): ThingModelApi.ThingModel {
  return {
    type: IoTThingModelTypeEnum.PROPERTY,
    dataType: IoTDataSpecsDataTypeEnum.INT,
    property: {
      dataType: IoTDataSpecsDataTypeEnum.INT,
      dataSpecs: {
        dataType: IoTDataSpecsDataTypeEnum.INT,
      },
    },
    service: {
      inputParams: [],
      outputParams: [],
    },
    event: {
      outputParams: [],
    },
  };
}

/** 回显数据时，规整各分支字段确保子表单可绑定 */
function normalizeFormData(
  result: ThingModelApi.ThingModel,
): ThingModelApi.ThingModel {
  const next: any = { ...result, type: Number(result.type) };
  if (isEmpty(next.property)) {
    next.dataType = IoTDataSpecsDataTypeEnum.INT;
    next.property = {
      dataType: IoTDataSpecsDataTypeEnum.INT,
      dataSpecs: { dataType: IoTDataSpecsDataTypeEnum.INT },
    };
  } else {
    next.property.dataSpecs ??= {};
    next.property.dataSpecsList ??= [];
    next.property.dataType ??= IoTDataSpecsDataTypeEnum.INT;
  }
  if (isEmpty(next.service)) {
    next.service = { inputParams: [], outputParams: [] };
  } else {
    next.service.inputParams ??= [];
    next.service.outputParams ??= [];
  }
  if (isEmpty(next.event)) {
    next.event = { outputParams: [] };
  } else {
    next.event.outputParams ??= [];
  }
  return next;
}

/** 按功能类型将子表单数据回写到顶层，并清理无关分支 */
function fillExtraAttributes(data: any) {
  switch (data.type) {
    case IoTThingModelTypeEnum.EVENT: {
      removeDataSpecs(data.event);
      data.dataType = data.event.dataType;
      data.event.identifier = data.identifier;
      data.event.name = data.name;
      delete data.property;
      delete data.service;

      break;
    }
    case IoTThingModelTypeEnum.PROPERTY: {
      removeDataSpecs(data.property);
      data.dataType = data.property.dataType;
      data.property.identifier = data.identifier;
      data.property.name = data.name;
      delete data.service;
      delete data.event;

      break;
    }
    case IoTThingModelTypeEnum.SERVICE: {
      removeDataSpecs(data.service);
      data.dataType = data.service.dataType;
      data.service.identifier = data.identifier;
      data.service.name = data.name;
      delete data.property;
      delete data.event;

      break;
    }
    // No default
  }
}

/** 清理空的 dataSpecs / dataSpecsList */
function removeDataSpecs(val: any) {
  if (isEmpty(val.dataSpecs)) {
    delete val.dataSpecs;
  }
  if (isEmpty(val.dataSpecsList)) {
    delete val.dataSpecsList;
  }
}
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <ElForm ref="formRef" :model="formData" class="mx-4" label-width="140px">
      <ElFormItem
        :rules="ThingModelFormRules.type"
        label="功能类型"
        prop="type"
      >
        <ElRadioGroup v-model="formData.type">
          <ElRadioButton
            v-for="dict in getDictOptions(DICT_TYPE.IOT_THING_MODEL_TYPE)"
            :key="String(dict.value)"
            :value="Number(dict.value)"
          >
            {{ dict.label }}
          </ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem
        :rules="ThingModelFormRules.name"
        label="功能名称"
        prop="name"
      >
        <ElInput v-model="formData.name" placeholder="请输入功能名称" />
      </ElFormItem>
      <ElFormItem
        :rules="ThingModelFormRules.identifier"
        label="标识符"
        prop="identifier"
      >
        <ElInput
          v-model="formData.identifier"
          placeholder="请输入标识符"
        />
      </ElFormItem>
      <!-- 属性配置 -->
      <ThingModelProperty
        v-if="formData.type === IoTThingModelTypeEnum.PROPERTY"
        v-model="formData.property"
      />
      <!-- 服务配置 -->
      <ThingModelService
        v-if="formData.type === IoTThingModelTypeEnum.SERVICE"
        v-model="formData.service"
      />
      <!-- 事件配置 -->
      <ThingModelEvent
        v-if="formData.type === IoTThingModelTypeEnum.EVENT"
        v-model="formData.event"
      />
      <ElFormItem label="描述" prop="description">
        <ElInput
          v-model="formData.description"
          :maxlength="200"
          :rows="3"
          placeholder="请输入物模型描述"
          type="textarea"
        />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
