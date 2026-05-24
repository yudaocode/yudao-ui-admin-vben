<script lang="ts" setup>
import type { IotProductApi } from '#/api/iot/product/product';

import { ref } from 'vue';

import { DeviceTypeEnum, DICT_TYPE } from '@vben/constants';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElMessage,
} from 'element-plus';

import { DictTag } from '#/components/dict-tag';

interface Props {
  product: IotProductApi.Product;
}

defineProps<Props>();

const showProductSecret = ref(false); // 是否显示产品密钥

/** 格式化日期 */
function formatDate(date?: Date | string) {
  if (!date) {
    return '-';
  }
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
    ElMessage.success('复制成功');
  } catch {
    ElMessage.error('复制失败');
  }
}
</script>

<template>
  <ElCard>
    <template #header>产品信息</template>
    <ElDescriptions :column="3" border size="small">
      <ElDescriptionsItem label="产品名称">
        {{ product.name }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="所属分类">
        {{ product.categoryName || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="设备类型">
        <DictTag
          :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
          :value="product.deviceType"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间">
        {{ formatDate(product.createTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="协议类型">
        <DictTag
          :type="DICT_TYPE.IOT_PROTOCOL_TYPE"
          :value="product.protocolType"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="序列化类型">
        <DictTag
          :type="DICT_TYPE.IOT_SERIALIZE_TYPE"
          :value="product.serializeType"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="产品状态">
        <DictTag :type="DICT_TYPE.IOT_PRODUCT_STATUS" :value="product.status" />
      </ElDescriptionsItem>
      <ElDescriptionsItem
        v-if="
          (
            [DeviceTypeEnum.DEVICE, DeviceTypeEnum.GATEWAY] as number[]
          ).includes(product.deviceType!)
        "
        label="联网方式"
      >
        <DictTag :type="DICT_TYPE.IOT_NET_TYPE" :value="product.netType" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="产品密钥">
        <span v-if="showProductSecret">{{ product.productSecret }}</span>
        <span v-else>********</span>
        <ElButton class="ml-2" size="small" @click="toggleProductSecretVisible">
          {{ showProductSecret ? '隐藏' : '显示' }}
        </ElButton>
        <ElButton
          v-if="showProductSecret && product.productSecret"
          class="ml-2"
          size="small"
          @click="copyToClipboard(product.productSecret || '')"
        >
          复制
        </ElButton>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="动态注册">
        {{ product.registerEnabled ? '已开启' : '未开启' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem :span="3" label="产品描述">
        {{ product.description || '-' }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </ElCard>
</template>
