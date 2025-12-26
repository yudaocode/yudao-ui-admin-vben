<script lang="ts" setup>
import type { IotProductApi } from '#/api/iot/product/product';

import { DeviceTypeEnum, DICT_TYPE } from '@vben/constants';

import { Card, Descriptions } from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';

interface Props {
  product: IotProductApi.Product;
}

defineProps<Props>();

/** 格式化日期 */
function formatDate(date?: Date | string) {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
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
      <Descriptions.Item label="定位类型">
        {{ product.locationType ?? '-' }}
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
      <Descriptions.Item :span="3" label="产品描述">
        {{ product.description || '-' }}
      </Descriptions.Item>
    </Descriptions>
  </Card>
</template>
