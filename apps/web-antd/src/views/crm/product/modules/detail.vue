<script setup lang="ts">
import type { CrmProductApi } from '#/api/crm/product';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, Card, Tabs } from 'ant-design-vue';

import { getOperateLogPage } from '#/api/crm/operateLog';
import { BizTypeEnum } from '#/api/crm/permission';
import { getProduct } from '#/api/crm/product';
import { useDescription } from '#/components/description';
import { AsyncOperateLog } from '#/components/operate-log';
import { ProductDetailsInfo } from '#/views/crm/product';

import { useDetailSchema } from './detail-data';

const loading = ref(false);

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const productId = ref(0);

const product = ref<CrmProductApi.Product>({} as CrmProductApi.Product);
const productLogList = ref<SystemOperateLogApi.OperateLog[]>([]);

const [Description] = useDescription({
  componentProps: {
    bordered: false,
    column: 4,
    class: 'mx-4',
  },
  schema: useDetailSchema(),
});

/** 加载详情 */
async function loadProductDetail() {
  loading.value = true;
  const data = await getProduct(productId.value);
  const logList = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_PRODUCT,
    bizId: productId.value,
  });
  productLogList.value = logList.list;
  product.value = data;
  loading.value = false;
}

/** 返回列表页 */
function handleBack() {
  tabs.closeCurrentTab();
  router.push('/crm/product');
}

// 加载数据
onMounted(() => {
  productId.value = Number(route.params.id);
  loadProductDetail();
});
</script>

<template>
  <Page auto-content-height :title="product?.name" :loading="loading">
    <template #extra>
      <div class="flex items-center gap-2">
        <Button @click="handleBack"> 返回 </Button>
      </div>
    </template>
    <Card class="min-h-[10%]">
      <Description :data="product" />
    </Card>
    <Card class="mt-4 min-h-[60%]">
      <Tabs>
        <Tabs.TabPane tab="详细资料" key="1" :force-render="true">
          <ProductDetailsInfo :product="product" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="操作日志" key="2" :force-render="true">
          <AsyncOperateLog :log-list="productLogList" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
