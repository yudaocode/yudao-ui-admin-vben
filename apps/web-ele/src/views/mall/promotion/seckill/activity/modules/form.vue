<script lang="ts" setup>
import type { MallSeckillActivityApi } from '#/api/mall/promotion/seckill/seckillActivity';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getSpu } from '#/api/mall/product/spu';
import {
  createSeckillActivity,
  getSeckillActivity,
  updateSeckillActivity,
} from '#/api/mall/promotion/seckill/seckillActivity';
import { $t } from '#/locales';
import { SpuSkuSelect } from '#/views/mall/product/spu/components';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MallSeckillActivityApi.SeckillActivity>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['秒杀活动'])
    : $t('ui.actionTitle.create', ['秒杀活动']);
});

const spuId = ref<number>();
const spuName = ref<string>('');
const skuTableData = ref<any[]>([]);
const spuSkuSelectRef = ref();

const handleSelectProduct = () => {
  spuSkuSelectRef.value?.open();
};

async function handleSpuSelected(selectedSpuId: number, skuIds?: number[]) {
  const spu = await getSpu(selectedSpuId);
  if (!spu) return;

  spuId.value = spu.id;
  spuName.value = spu.name || '';

  const selectedSkus = skuIds
    ? spu.skus?.filter((sku) => skuIds.includes(sku.id!))
    : spu.skus;

  skuTableData.value =
    selectedSkus?.map((sku) => ({
      skuId: sku.id!,
      skuName: sku.name || '',
      picUrl: sku.picUrl || spu.picUrl || '',
      price: sku.price || 0,
      stock: 0,
      seckillPrice: 0,
    })) || [];
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    if (!spuId.value) {
      ElMessage.error('请选择秒杀商品');
      return;
    }
    if (skuTableData.value.length === 0) {
      ElMessage.error('请至少配置一个 SKU');
      return;
    }
    const hasInvalidSku = skuTableData.value.some(
      (sku) => sku.stock < 1 || sku.seckillPrice < 0.01,
    );
    if (hasInvalidSku) {
      ElMessage.error('请正确配置 SKU 的秒杀库存（≥1）和秒杀价格（≥0.01）');
      return;
    }

    modalApi.lock();
    try {
      const values = await formApi.getValues();
      const data: any = {
        ...values,
        spuId: spuId.value,
        products: skuTableData.value.map((sku) => ({
          skuId: sku.skuId,
          stock: sku.stock,
          seckillPrice: Math.round(sku.seckillPrice * 100),
        })),
      };
      await (formData.value?.id
        ? updateSeckillActivity(data)
        : createSeckillActivity(data));
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      spuId.value = undefined;
      spuName.value = '';
      skuTableData.value = [];
      return;
    }
    const data = modalApi.getData<MallSeckillActivityApi.SeckillActivity>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSeckillActivity(data.id);
      await formApi.setValues(formData.value);
      if (formData.value.spuId) {
        const spu = await getSpu(formData.value.spuId);
        if (spu) {
          spuId.value = spu.id;
          spuName.value = spu.name || '';
          const products = formData.value.products || [];
          skuTableData.value =
            spu.skus
              ?.filter((sku) => products.some((p) => p.skuId === sku.id))
              .map((sku) => {
                const product = products.find((p) => p.skuId === sku.id);
                return {
                  skuId: sku.id!,
                  skuName: sku.name || '',
                  picUrl: sku.picUrl || spu.picUrl || '',
                  price: sku.price || 0,
                  stock: product?.stock || 0,
                  seckillPrice: (product?.seckillPrice || 0) / 100,
                };
              }) || [];
        }
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-4/5" :title="getTitle">
    <div class="mx-4">
      <Form />
      <div class="mt-4">
        <div class="mb-2 flex items-center">
          <span class="text-sm font-medium">秒杀活动商品:</span>
          <el-button class="ml-2" type="primary" @click="handleSelectProduct">
            选择商品
          </el-button>
          <span v-if="spuName" class="ml-4 text-sm text-gray-600">
            已选择: {{ spuName }}
          </span>
        </div>
        <div v-if="skuTableData.length > 0" class="mt-4">
          <table class="w-full border-collapse border border-gray-300">
            <thead>
              <tr class="bg-gray-100">
                <th class="border border-gray-300 px-4 py-2">商品图片</th>
                <th class="border border-gray-300 px-4 py-2">SKU 名称</th>
                <th class="border border-gray-300 px-4 py-2">原价(元)</th>
                <th class="border border-gray-300 px-4 py-2">秒杀库存</th>
                <th class="border border-gray-300 px-4 py-2">秒杀价格(元)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sku, index) in skuTableData" :key="index">
                <td class="border border-gray-300 px-4 py-2 text-center">
                  <img
                    v-if="sku.picUrl"
                    :src="sku.picUrl"
                    alt="商品图片"
                    class="h-16 w-16 object-cover"
                  />
                </td>
                <td class="border border-gray-300 px-4 py-2">
                  {{ sku.skuName }}
                </td>
                <td class="border border-gray-300 px-4 py-2 text-center">
                  ¥{{ (sku.price / 100).toFixed(2) }}
                </td>
                <td class="border border-gray-300 px-4 py-2">
                  <input
                    v-model.number="sku.stock"
                    type="number"
                    min="0"
                    class="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </td>
                <td class="border border-gray-300 px-4 py-2">
                  <input
                    v-model.number="sku.seckillPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full rounded border border-gray-300 px-2 py-1"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Modal>
  <SpuSkuSelect
    ref="spuSkuSelectRef"
    :is-select-sku="true"
    @select="handleSpuSelected"
  />
</template>
