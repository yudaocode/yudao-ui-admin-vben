<script setup lang="ts">
import type { IotProductApi } from '#/api/iot/product/product';

import { DICT_TYPE } from '@vben/constants';

import { DeviceTypeEnum } from '#/api/iot/product/product';
import { DictTag } from '#/components/dict-tag';

interface Props {
  product: IotProductApi.Product;
}

defineProps<Props>();

/** 格式化日期 */
const formatDate = (date?: Date | string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};
</script>

<template>
  <a-card title="产品信息">
    <a-descriptions bordered :column="3">
      <a-descriptions-item label="产品名称">
        {{ product.name }}
      </a-descriptions-item>
      <a-descriptions-item label="所属分类">
        {{ product.categoryName || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="设备类型">
        <DictTag
          :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
          :value="product.deviceType"
        />
      </a-descriptions-item>
      <a-descriptions-item label="定位类型">
        {{ product.locationType ?? '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="创建时间">
        {{ formatDate(product.createTime) }}
      </a-descriptions-item>
      <a-descriptions-item label="数据格式">
        {{ product.codecType || '-' }}
      </a-descriptions-item>
      <a-descriptions-item label="产品状态">
        <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="product.status" />
      </a-descriptions-item>
      <a-descriptions-item
        v-if="
          [DeviceTypeEnum.DEVICE, DeviceTypeEnum.GATEWAY].includes(
            product.deviceType!,
          )
        "
        label="联网方式"
      >
        <DictTag :type="DICT_TYPE.IOT_NET_TYPE" :value="product.netType" />
      </a-descriptions-item>
      <a-descriptions-item label="产品描述" :span="3">
        {{ product.description || '-' }}
      </a-descriptions-item>
    </a-descriptions>
  </a-card>
</template>
