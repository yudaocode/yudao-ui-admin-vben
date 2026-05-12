<script lang="ts" setup>
import type { IotProductApi } from '#/api/iot/product/product';

import { ref } from 'vue';

import { DeviceTypeEnum, DICT_TYPE } from '@vben/constants';

import { Button, Card, Descriptions, message } from 'antdv-next';

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
      <DescriptionsItem label="产品名称">
        {{ product.name }}
      </DescriptionsItem>
      <DescriptionsItem label="所属分类">
        {{ product.categoryName || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="设备类型">
        <DictTag
          :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
          :value="product.deviceType"
        />
      </DescriptionsItem>
      <DescriptionsItem label="创建时间">
        {{ formatDate(product.createTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="协议类型">
        <DictTag
          :type="DICT_TYPE.IOT_PROTOCOL_TYPE"
          :value="product.protocolType"
        />
      </DescriptionsItem>
      <DescriptionsItem label="序列化类型">
        <DictTag
          :type="DICT_TYPE.IOT_SERIALIZE_TYPE"
          :value="product.serializeType"
        />
      </DescriptionsItem>
      <DescriptionsItem label="产品状态">
        <DictTag :type="DICT_TYPE.IOT_PRODUCT_STATUS" :value="product.status" />
      </DescriptionsItem>
      <DescriptionsItem
        v-if="
          [DeviceTypeEnum.DEVICE, DeviceTypeEnum.GATEWAY].includes(
            product.deviceType!,
          )
        "
        label="联网方式"
      >
        <DictTag :type="DICT_TYPE.IOT_NET_TYPE" :value="product.netType" />
      </DescriptionsItem>
      <DescriptionsItem v-if="product.productSecret" label="ProductSecret">
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
      </DescriptionsItem>
      <DescriptionsItem label="动态注册">
        {{ product.registerEnabled ? '已开启' : '未开启' }}
      </DescriptionsItem>
      <DescriptionsItem :span="3" label="产品描述">
        {{ product.description || '-' }}
      </DescriptionsItem>
    </Descriptions>
  </Card>
</template>
