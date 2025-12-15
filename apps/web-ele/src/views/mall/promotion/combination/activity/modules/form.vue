<script lang="ts" setup>
import type { MallCombinationActivityApi } from '#/api/mall/promotion/combination/combinationActivity';

import { computed, nextTick, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { getSpu } from '#/api/mall/product/spu';
import {
  createCombinationActivity,
  getCombinationActivity,
  updateCombinationActivity,
} from '#/api/mall/promotion/combination/combinationActivity';
import { $t } from '#/locales';
import { SpuSkuSelect } from '#/views/mall/product/spu/components';

import { useFormSchema } from '../data';

defineOptions({ name: 'CombinationActivityForm' });

const emit = defineEmits(['success']);
const formData = ref<MallCombinationActivityApi.CombinationActivity>();

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['拼团活动'])
    : $t('ui.actionTitle.create', ['拼团活动']);
});

// ================= 商品选择相关 =================
const spuId = ref<number>();
const spuName = ref<string>('');
const skuTableData = ref<any[]>([]);

const spuSkuSelectRef = ref(); // 商品选择弹窗 Ref

/** 打开商品选择弹窗 */
const handleSelectProduct = () => {
  spuSkuSelectRef.value?.open();
};

/** 选择商品后的回调 */
async function handleSpuSelected(selectedSpuId: number, skuIds?: number[]) {
  const spu = await getSpu(selectedSpuId);
  if (!spu) return;

  spuId.value = spu.id;
  spuName.value = spu.name || '';

  // 筛选指定的 SKU
  const selectedSkus = skuIds
    ? spu.skus?.filter((sku) => skuIds.includes(sku.id!))
    : spu.skus;

  skuTableData.value =
    selectedSkus?.map((sku) => ({
      skuId: sku.id!,
      skuName: sku.name || '',
      picUrl: sku.picUrl || spu.picUrl || '',
      price: sku.price || 0,
      combinationPrice: 0,
    })) || [];
}

// ================= end =================

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    // 验证商品和 SKU 配置
    if (!spuId.value) {
      ElMessage.error('请选择拼团商品');
      return;
    }
    if (skuTableData.value.length === 0) {
      ElMessage.error('请至少配置一个 SKU');
      return;
    }
    // 验证 SKU 配置
    const hasInvalidSku = skuTableData.value.some(
      (sku) => sku.combinationPrice < 0.01,
    );
    if (hasInvalidSku) {
      ElMessage.error('请正确配置 SKU 的拼团价格（≥0.01）');
      return;
    }

    // 提交表单
    modalApi.lock();
    try {
      const values = await formApi.getValues();
      const data: any = {
        ...values,
        spuId: spuId.value,
        products: skuTableData.value.map((sku) => ({
          skuId: sku.skuId,
          combinationPrice: Math.round(sku.combinationPrice * 100), // 转换为分
        })),
      };
      await (formData.value?.id
        ? updateCombinationActivity(data)
        : createCombinationActivity(data));
      // 关闭并提示
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
    // 加载数据
    const data =
      modalApi.getData<MallCombinationActivityApi.CombinationActivity>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getCombinationActivity(data.id);
      await nextTick();
      await formApi.setValues(formData.value);
      // 加载商品和 SKU 信息
      // TODO @puhui999：if return，简化括号层级
      if (formData.value.spuId) {
        const spu = await getSpu(formData.value.spuId);
        if (spu) {
          spuId.value = spu.id;
          spuName.value = spu.name || '';
          // 回填 SKU 配置
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
                  combinationPrice: (product?.combinationPrice || 0) / 100, // 分转元
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

      <!-- 商品选择区域 -->
      <div class="mt-4">
        <div class="mb-2 flex items-center">
          <span class="text-sm font-medium">拼团活动商品:</span>
          <ElButton class="ml-2" type="primary" @click="handleSelectProduct">
            选择商品
          </ElButton>
          <span v-if="spuName" class="ml-4 text-sm text-gray-600">
            已选择: {{ spuName }}
          </span>
        </div>

        <!-- SKU 配置表格 -->
        <div v-if="skuTableData.length > 0" class="mt-4">
          <table class="w-full border-collapse border border-gray-300">
            <thead>
              <tr class="bg-gray-100">
                <th class="border border-gray-300 px-4 py-2">商品图片</th>
                <th class="border border-gray-300 px-4 py-2">SKU 名称</th>
                <th class="border border-gray-300 px-4 py-2">原价(元)</th>
                <th class="border border-gray-300 px-4 py-2">拼团价格(元)</th>
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
                <!-- TODO @puhui999：这里貌似和 element-plus 没对齐；；ps：是不是用 grid 组件呀？或者 vxe 组件
                 图片
                  商品条码
                  销售价(元)
                  市场价(元)
                  成本价(元)
                  库存
                  拼团价格(元)
                 -->
                <td class="border border-gray-300 px-4 py-2">
                  {{ sku.skuName }}
                </td>
                <td class="border border-gray-300 px-4 py-2 text-center">
                  ¥{{ (sku.price / 100).toFixed(2) }}
                </td>
                <td class="border border-gray-300 px-4 py-2">
                  <!-- TODO @puhui999：是不是要使用 antd 的哈？ -->
                  <input
                    v-model.number="sku.combinationPrice"
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

  <!-- 商品选择器弹窗 -->
  <SpuSkuSelect
    ref="spuSkuSelectRef"
    :is-select-sku="true"
    @select="handleSpuSelected"
  />
</template>
