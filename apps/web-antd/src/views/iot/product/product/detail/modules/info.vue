<script lang="ts" setup>
import type { IotProductApi } from '#/api/iot/product/product';

import { ref } from 'vue';

import { DeviceTypeEnum, DICT_TYPE } from '@vben/constants';

import { Button, Card, Descriptions, message } from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';

interface Props {
  product: IotProductApi.Product;
}

defineProps<Props>();

const showProductSecret = ref(false); // 是否显示产品密钥

/** 格式化日期 */
function formatDate(date?: Date | string) {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
}

/** 切换产品密钥显示状态 */
function toggleProductSecretVisible() {
  showProductSecret.value = !showProductSecret.value;
}

/** 复制到剪贴板 */
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
}
</script>

<template>
  <Card title="产品信息">
    <Descriptions :column="3" bordered size="small">
      <Descriptions.Item label="产品名称">
        {{ product.name }}
      </Descriptions.Item>
      <Descriptions.Item label="所属分类">
        {{ product.categoryName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="设备类型">
        <DictTag
          :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
          :value="product.deviceType"
        />
      </Descriptions.Item>
      <Descriptions.Item label="创建时间">
        {{ formatDate(product.createTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="数据格式">
        {{ product.codecType || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="产品状态">
        <DictTag :type="DICT_TYPE.IOT_PRODUCT_STATUS" :value="product.status" />
      </Descriptions.Item>
      <Descriptions.Item
        v-if="
          [DeviceTypeEnum.DEVICE, DeviceTypeEnum.GATEWAY].includes(
            product.deviceType!,
          )
        "
        label="联网方式"
      >
        <DictTag :type="DICT_TYPE.IOT_NET_TYPE" :value="product.netType" />
      </Descriptions.Item>
      <Descriptions.Item v-if="product.productSecret" label="ProductSecret">
        <span v-if="showProductSecret">{{ product.productSecret }}</span>
        <span v-else>********</span>
        <Button class="ml-2" size="small" @click="toggleProductSecretVisible">
          {{ showProductSecret ? '隐藏' : '显示' }}
        </Button>
        <Button
          class="ml-2"
          size="small"
          @click="copyToClipboard(product.productSecret || '')"
        >
          复制
        </Button>
      </Descriptions.Item>
      <Descriptions.Item label="动态注册">
        {{ product.registerEnabled ? '已开启' : '未开启' }}
      </Descriptions.Item>
      <Descriptions.Item :span="3" label="产品描述">
        {{ product.description || '-' }}
      </Descriptions.Item>
    </Descriptions>
  </Card>
</template>
