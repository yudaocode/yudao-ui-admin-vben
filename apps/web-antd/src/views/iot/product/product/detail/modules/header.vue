<script lang="ts" setup>
import type { IotProductApi } from '#/api/iot/product/product';

import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { ProductStatusEnum } from '@vben/constants';

import {
  Button,
  Card,
  Descriptions,
  message,
  Popconfirm,
} from 'ant-design-vue';

import {
  syncProductPropertyTable,
  updateProductStatus,
} from '#/api/iot/product/product';

import Form from '../../modules/form.vue';

interface Props {
  product: IotProductApi.Product;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  refresh: [];
}>();

const router = useRouter();
const { hasAccessByCodes } = useAccess();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 复制到剪贴板 */
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
}

/** 跳转到设备管理 */
function goToDeviceList(productId: number) {
  router.push({
    name: 'IoTDevice',
    query: { productId: String(productId) },
  });
}

/** 打开编辑表单 */
function openEditForm(row: IotProductApi.Product) {
  formModalApi.setData(row).open();
}

/** 发布产品 */
async function handlePublish(product: IotProductApi.Product) {
  await updateProductStatus(product.id!, ProductStatusEnum.PUBLISHED);
  message.success('发布成功');
  emit('refresh');
}

/** 撤销发布 */
async function handleUnpublish(product: IotProductApi.Product) {
  await updateProductStatus(product.id!, ProductStatusEnum.UNPUBLISHED);
  message.success('撤销发布成功');
  emit('refresh');
}

/** 同步物模型超级表结构 */
async function handleSyncPropertyTable(product: IotProductApi.Product) {
  await syncProductPropertyTable(product.id!);
  message.success('同步成功');
}
</script>

<template>
  <div class="mb-4">
    <FormModal @success="emit('refresh')" />

    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-xl font-bold">{{ product.name }}</h2>
      </div>
      <div class="flex gap-2">
        <Button
          v-if="hasAccessByCodes(['iot:product:update'])"
          :disabled="product.status === ProductStatusEnum.PUBLISHED"
          @click="openEditForm(product)"
        >
          编辑
        </Button>
        <Popconfirm
          v-if="
            product.status === ProductStatusEnum.UNPUBLISHED &&
            hasAccessByCodes(['iot:product:update'])
          "
          :title="`确认要发布产品「${product.name}」吗？`"
          @confirm="handlePublish(product)"
        >
          <Button type="primary">发布</Button>
        </Popconfirm>
        <Popconfirm
          v-if="
            product.status === ProductStatusEnum.PUBLISHED &&
            hasAccessByCodes(['iot:product:update'])
          "
          :title="`确认要撤销发布产品「${product.name}」吗？`"
          @confirm="handleUnpublish(product)"
        >
          <Button danger>撤销发布</Button>
        </Popconfirm>
        <Popconfirm
          v-if="hasAccessByCodes(['iot:product:update'])"
          :title="`确认要同步产品「${product.name}」的物模型超级表结构吗？`"
          @confirm="handleSyncPropertyTable(product)"
        >
          <Button>同步物模型表结构</Button>
        </Popconfirm>
      </div>
    </div>

    <Card class="mt-4">
      <Descriptions :column="1">
        <Descriptions.Item label="ProductKey">
          {{ product.productKey }}
          <Button
            class="ml-2"
            size="small"
            @click="copyToClipboard(product.productKey || '')"
          >
            复制
          </Button>
        </Descriptions.Item>
        <Descriptions.Item label="设备总数">
          <span class="ml-5 mr-2">
            {{ product.deviceCount ?? '加载中...' }}
          </span>
          <Button size="small" @click="goToDeviceList(product.id!)">
            前往管理
          </Button>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  </div>
</template>
