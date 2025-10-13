<!-- 产品的物模型表单 -->
<script lang="ts" setup>
import type { Ref } from 'vue';

import type { ProductVO } from '#/api/iot/product/product';
import type { ThingModelData } from '#/api/iot/thingmodel';

import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { DICT_TYPE, getIntDictOptions } from '@vben/constants';

import { message } from 'ant-design-vue';
import { cloneDeep } from 'lodash-es';

import { ThingModelApi, ThingModelFormRules } from '#/api/iot/thingmodel';
import {
  IOT_PROVIDE_KEY,
  IoTDataSpecsDataTypeEnum,
  IoTThingModelTypeEnum,
} from '#/views/iot/utils/constants';

import ThingModelEvent from './ThingModelEvent.vue';
import ThingModelProperty from './ThingModelProperty.vue';
import ThingModelService from './ThingModelService.vue';

/** IoT 物模型数据表单 */
defineOptions({ name: 'IoTThingModelForm' });

/** 提交表单 */
const emit = defineEmits(['success']);
const product = inject<Ref<ProductVO>>(IOT_PROVIDE_KEY.PRODUCT); // 注入产品信息

const { t } = useI18n(); // 国际化

const dialogVisible = ref(false); // 弹窗的是否展示
const dialogTitle = ref(''); // 弹窗的标题
const formLoading = ref(false); // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref(''); // 表单的类型：create - 新增；update - 修改
const formData = ref<ThingModelData>({
  type: IoTThingModelTypeEnum.PROPERTY,
  dataType: IoTDataSpecsDataTypeEnum.INT,
  property: {
    dataType: IoTDataSpecsDataTypeEnum.INT,
    dataSpecs: {
      dataType: IoTDataSpecsDataTypeEnum.INT,
    },
  },
  service: {},
  event: {},
} as ThingModelData);

const formRef = ref(); // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true;
  dialogTitle.value = t(`action.${type}`);
  formType.value = type;
  resetForm();
  if (id) {
    formLoading.value = true;
    try {
      formData.value = await ThingModelApi.getThingModel(id);
      // 情况一：属性初始化
      if (
        !formData.value.property ||
        Object.keys(formData.value.property).length === 0
      ) {
        formData.value.dataType = IoTDataSpecsDataTypeEnum.INT;
        formData.value.property = {
          dataType: IoTDataSpecsDataTypeEnum.INT,
          dataSpecs: {
            dataType: IoTDataSpecsDataTypeEnum.INT,
          },
        };
      }
      // 情况二：服务初始化
      if (
        !formData.value.service ||
        Object.keys(formData.value.service).length === 0
      ) {
        formData.value.service = {};
      }
      // 情况三：事件初始化
      if (
        !formData.value.event ||
        Object.keys(formData.value.event).length === 0
      ) {
        formData.value.event = {};
      }
    } finally {
      formLoading.value = false;
    }
  }
};
defineExpose({ open, close: () => (dialogVisible.value = false) });

const submitForm = async () => {
  await formRef.value.validate();
  formLoading.value = true;
  try {
    const data = cloneDeep(formData.value) as ThingModelData;
    // 信息补全
    data.productId = product!.value.id;
    data.productKey = product!.value.productKey;
    fillExtraAttributes(data);
    if (formType.value === 'create') {
      await ThingModelApi.createThingModel(data);
      message.success({ content: t('common.createSuccess') });
    } else {
      await ThingModelApi.updateThingModel(data);
      message.success({ content: t('common.updateSuccess') });
    }
    // 关闭弹窗
    dialogVisible.value = false;
    emit('success');
  } finally {
    formLoading.value = false;
  }
};

/** 填写额外的属性（处理不同类型的情况） */
const fillExtraAttributes = (data: any) => {
  // 属性
  if (data.type === IoTThingModelTypeEnum.PROPERTY) {
    removeDataSpecs(data.property);
    data.dataType = data.property.dataType;
    data.property.identifier = data.identifier;
    data.property.name = data.name;
    delete data.service;
    delete data.event;
  }
  // 服务
  if (data.type === IoTThingModelTypeEnum.SERVICE) {
    removeDataSpecs(data.service);
    data.dataType = data.service.dataType;
    data.service.identifier = data.identifier;
    data.service.name = data.name;
    delete data.property;
    delete data.event;
  }
  // 事件
  if (data.type === IoTThingModelTypeEnum.EVENT) {
    removeDataSpecs(data.event);
    data.dataType = data.event.dataType;
    data.event.identifier = data.identifier;
    data.event.name = data.name;
    delete data.property;
    delete data.service;
  }
};

/** 处理 dataSpecs 为空的情况 */
const removeDataSpecs = (val: any) => {
  if (!val.dataSpecs || Object.keys(val.dataSpecs).length === 0) {
    delete val.dataSpecs;
  }
  if (!val.dataSpecsList || val.dataSpecsList.length === 0) {
    delete val.dataSpecsList;
  }
};

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    type: IoTThingModelTypeEnum.PROPERTY,
    dataType: IoTDataSpecsDataTypeEnum.INT,
    property: {
      dataType: IoTDataSpecsDataTypeEnum.INT,
      dataSpecs: {
        dataType: IoTDataSpecsDataTypeEnum.INT,
      },
    },
    service: {},
    event: {},
  } as ThingModelData;
  formRef.value?.resetFields();
};
</script>

<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <a-form
      ref="formRef"
      :loading="formLoading"
      :model="formData"
      :rules="ThingModelFormRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <a-form-item label="功能类型" name="type">
        <a-radio-group v-model:value="formData.type">
          <a-radio-button
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_THING_MODEL_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="功能名称" name="name">
        <a-input v-model:value="formData.name" placeholder="请输入功能名称" />
      </a-form-item>
      <a-form-item label="标识符" name="identifier">
        <a-input
          v-model:value="formData.identifier"
          placeholder="请输入标识符"
        />
      </a-form-item>
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
      <a-form-item label="描述" name="description">
        <a-textarea
          v-model:value="formData.description"
          :maxlength="200"
          :rows="3"
          placeholder="请输入属性描述"
        />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button :disabled="formLoading" type="primary" @click="submitForm">
        确 定
      </a-button>
      <a-button @click="dialogVisible = false">取 消</a-button>
    </template>
  </Dialog>
</template>
