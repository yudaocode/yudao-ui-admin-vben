<script lang="ts" setup>
import type { DataSinkApi } from '#/api/iot/rule/data/sink';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';

import {
  createDataSink,
  getDataSink,
  IotDataSinkTypeEnum,
  updateDataSink,
} from '#/api/iot/rule/data/sink';
import { $t } from '#/locales';

import {
  DatabaseConfigForm,
  HttpConfigForm,
  KafkaMqConfigForm,
  MqttConfigForm,
  RabbitMqConfigForm,
  RedisStreamConfigForm,
  RocketMqConfigForm,
  TcpConfigForm,
  WebSocketConfigForm,
} from '../config';

const emit = defineEmits(['success']);

const formRef = ref();
const formData = ref<DataSinkApi.DataSink>(buildEmptyFormData());

const getTitle = computed(() =>
  formData.value.id
    ? $t('ui.actionTitle.edit', ['数据目的'])
    : $t('ui.actionTitle.create', ['数据目的']),
);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    try {
      const data = { ...formData.value };
      await (data.id ? updateDataSink(data) : createDataSink(data));
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
    formData.value = buildEmptyFormData();
    formRef.value?.clearValidate?.();
    const data = modalApi.getData<{ id?: number }>();
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getDataSink(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});

/** 构造空白表单数据 */
function buildEmptyFormData(): DataSinkApi.DataSink {
  return {
    status: CommonStatusEnum.ENABLE,
    type: IotDataSinkTypeEnum.HTTP,
    config: {} as any,
  };
}

/** 类型切换时清空配置，子组件 onMounted 会按新类型重新初始化 */
function handleTypeChange(type: number) {
  formData.value.type = type;
  formData.value.config = {} as any;
}
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <ElForm ref="formRef" :model="formData" class="mx-4" label-width="100px">
      <ElFormItem
        :rules="[
          { required: true, message: '目的名称不能为空', trigger: 'blur' },
        ]"
        label="目的名称"
        prop="name"
      >
        <ElInput v-model="formData.name" placeholder="请输入目的名称" />
      </ElFormItem>
      <ElFormItem label="目的描述" prop="description">
        <ElInput
          v-model="formData.description"
          placeholder="请输入目的描述"
          type="textarea"
          :rows="3"
        />
      </ElFormItem>
      <ElFormItem
        :rules="[
          { required: true, message: '目的类型不能为空', trigger: 'change' },
        ]"
        label="目的类型"
        prop="type"
      >
        <ElSelect
          :model-value="formData.type"
          placeholder="请选择目的类型"
          @change="(value: any) => handleTypeChange(value as number)"
        >
          <ElOption
            v-for="dict in getDictOptions(
              DICT_TYPE.IOT_DATA_SINK_TYPE_ENUM,
              'number',
            )"
            :key="String(dict.value)"
            :label="dict.label"
            :value="dict.value"
          />
        </ElSelect>
      </ElFormItem>
      <!-- 配置项：按目的类型分支 -->
      <HttpConfigForm
        v-if="formData.type === IotDataSinkTypeEnum.HTTP"
        v-model="formData.config"
      />
      <TcpConfigForm
        v-if="formData.type === IotDataSinkTypeEnum.TCP"
        v-model="formData.config"
      />
      <WebSocketConfigForm
        v-if="formData.type === IotDataSinkTypeEnum.WEBSOCKET"
        v-model="formData.config"
      />
      <MqttConfigForm
        v-if="formData.type === IotDataSinkTypeEnum.MQTT"
        v-model="formData.config"
      />
      <DatabaseConfigForm
        v-if="formData.type === IotDataSinkTypeEnum.DATABASE"
        v-model="formData.config"
      />
      <RocketMqConfigForm
        v-if="formData.type === IotDataSinkTypeEnum.ROCKETMQ"
        v-model="formData.config"
      />
      <KafkaMqConfigForm
        v-if="formData.type === IotDataSinkTypeEnum.KAFKA"
        v-model="formData.config"
      />
      <RabbitMqConfigForm
        v-if="formData.type === IotDataSinkTypeEnum.RABBITMQ"
        v-model="formData.config"
      />
      <RedisStreamConfigForm
        v-if="formData.type === IotDataSinkTypeEnum.REDIS_STREAM"
        v-model="formData.config"
      />
      <ElFormItem
        :rules="[
          { required: true, message: '目的状态不能为空', trigger: 'change' },
        ]"
        label="目的状态"
        prop="status"
      >
        <ElRadioGroup v-model="formData.status">
          <ElRadio
            v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS, 'number')"
            :key="String(dict.value)"
            :value="dict.value"
          >
            {{ dict.label }}
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
