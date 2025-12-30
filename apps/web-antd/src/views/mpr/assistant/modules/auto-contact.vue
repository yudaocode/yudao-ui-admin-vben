<script lang="ts" setup>
import type { AssistantApi } from '#/api/mpr/assistant';

import { ref, watch } from 'vue';

import { Page, VbenCheckButtonGroup } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message, Table } from 'ant-design-vue';

import { updateAssistantConfig } from '#/api/mpr/assistantConfig';

const props = defineProps<{
  assistant?: AssistantApi.Assistant;
  assistantConfig?: AssistantApi.AssistantConfig;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const loading = ref(false);

const isAutoSendMessage = ref();

const options = [
  { label: '自动联系卖家', value: 1 },
  { label: '暂不需要', value: 0, num: 999 },
];

const columns = [
  {
    title: '商品名称',
    dataIndex: 'name',
    slots: { customRender: 'name' },
  },
  {
    title: '价格',
    dataIndex: 'price',
  },
  {
    title: '卖家',
    dataIndex: 'seller',
    slots: { customRender: 'seller' },
  },
  {
    title: '评分',
    dataIndex: 'score',
  },
  {
    title: '地区',
    dataIndex: 'region',
  },
  {
    title: '状态',
    dataIndex: 'status',
    slots: { customRender: 'status' },
  },
];

const dataSource = [
  {
    key: '1',
    name: '高端商务笔记本电脑 Pro',
    subName: '2024年新款',
    icon: 'LaptopOutlined',
    price: '¥12,999',
    seller: '科技数码专营店',
    sellerYear: '5年',
    score: '4.9',
    region: '深圳',
    status: '已选定',
  },
  {
    key: '2',
    name: '专业级无线降噪耳机',
    subName: '黑色尊享版',
    icon: 'HeadsetOutlined',
    price: '¥2,499',
    seller: '音频设备旗舰店',
    sellerYear: '3年',
    score: '4.8',
    region: '广州',
    status: '已选定',
  },
  {
    key: '3',
    name: '智能手表 2024版',
    subName: '钛金属版',
    icon: 'ClockCircleOutlined',
    price: '¥3,699',
    seller: '智能穿戴专卖店',
    sellerYear: '4年',
    score: '4.7',
    region: '上海',
    status: '已选定',
  },
];

async function onBtnClick(value) {
  const opt = options.find((o) => o.value === value);
  if (opt) {
    message.success(`点击了按钮${opt.label}，value = ${value}`);
  }
  loading.value = true;
  try {
    const params = {
      assistantId: props.assistant.id,
      isAutoSendMessage: isAutoSendMessage.value,
    };
    await updateAssistantConfig(params);
    // const ara = {
    //   id:props.assistant.id,
    //   configStep: 3,
    // }
    // await updateAssistant(ara);
    emit('success');
  } finally {
    loading.value = false;
  }
}
/** 动态更新表单值 */
watch(
  () => props.assistantConfig,
  (val: any) => {
    if (!val) {
      return;
    }
    isAutoSendMessage.value = val.isAutoSendMessage;
  },
  { immediate: true },
);
</script>

<template>
  <Page v-loading="loading">
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <!-- 标题区域 -->
      <h3 class="mb-6 text-xl font-bold text-gray-800">
        我们已经获得了一个意向商品列表，您可以自己跟卖家联系，或者交给Ara
      </h3>

      <!-- 商品列表表格 -->
      <div class="mb-8">
        <Table
          :columns="columns"
          :data-source="dataSource"
          bordered
          :pagination="false"
        />
      </div>

      <!-- 自动联系卖家区域 -->
      <div class="rounded border border-blue-100 bg-blue-50 p-4">
        <div class="mb-3 flex items-start gap-2">
          <IconifyIcon icon="mdi:handshake" class="mt-1 size-8 text-blue-500" />
          <div>
            <h4 class="text-base font-semibold text-gray-800">自动联系卖家</h4>
            <p class="text-sm text-gray-600">
              Ara
              可以帮您自动与已选定商品的卖家取得联系，询问商品详情并代为议价。
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <VbenCheckButtonGroup
            v-model="isAutoSendMessage"
            :options="options"
            btn-class="py-5"
            @click="onBtnClick"
            size="large"
          />
          <Button v-if="false" size="large" type="primary">开始联系卖家</Button>
          <Button v-if="false" size="large">暂不需要</Button>
          <Button type="link" class="mt-3 text-sm font-bold text-black">
            自定义联系模板>>
          </Button>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.vben-button-group.size-large button) {
  padding-top: 20px;
  padding-bottom: 20px;
}
</style>
