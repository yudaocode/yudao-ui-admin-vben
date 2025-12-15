<script lang="ts" setup>
import type { MallBargainActivityApi } from '#/api/mall/promotion/bargain/bargainActivity';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getSpu } from '#/api/mall/product/spu';
import {
  createBargainActivity,
  getBargainActivity,
  updateBargainActivity,
} from '#/api/mall/promotion/bargain/bargainActivity';
import { $t } from '#/locales';
import { SpuSkuSelect } from '#/views/mall/product/spu/components';

import { useFormSchema } from '../data';

defineOptions({ name: 'PromotionBargainActivityForm' });

const emit = defineEmits(['success']);

const formData = ref<MallBargainActivityApi.BargainActivity>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['砍价活动'])
    : $t('ui.actionTitle.create', ['砍价活动']);
});

// ================= 商品选择相关 =================
const spuId = ref<number>();
const skuId = ref<number>();
const spuName = ref<string>('');
const skuInfo = ref<{
  picUrl: string;
  price: number;
  skuName: string;
}>();

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

  // 砍价活动只选择一个 SKU
  if (skuIds && skuIds.length > 0) {
    const selectedSku = spu.skus?.find((sku) => sku.id === skuIds[0]);
    if (selectedSku) {
      skuId.value = selectedSku.id;
      skuInfo.value = {
        skuName: selectedSku.name || '',
        picUrl: selectedSku.picUrl || spu.picUrl || '',
        price: Number(selectedSku.price) || 0,
      };
    }
  }
}

// ================= end =================

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 130,
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

    // 验证商品和 SKU 选择
    if (!spuId.value) {
      message.error('请选择砍价商品');
      return;
    }
    if (!skuId.value) {
      message.error('请选择商品 SKU');
      return;
    }

    // 提交表单
    modalApi.lock();
    try {
      const values = await formApi.getValues();
      const data = {
        ...values,
        spuId: spuId.value,
        skuId: skuId.value,
        bargainFirstPrice: Math.round((values.bargainFirstPrice || 0) * 100),
        bargainMinPrice: Math.round((values.bargainMinPrice || 0) * 100),
        randomMinPrice: values.randomMinPrice
          ? Math.round(values.randomMinPrice * 100)
          : undefined,
        randomMaxPrice: values.randomMaxPrice
          ? Math.round(values.randomMaxPrice * 100)
          : undefined,
      } as MallBargainActivityApi.BargainActivity;
      await (formData.value?.id
        ? updateBargainActivity(data)
        : createBargainActivity(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      spuId.value = undefined;
      skuId.value = undefined;
      spuName.value = '';
      skuInfo.value = undefined;
      return;
    }
    // 加载表单数据
    const data = modalApi.getData<MallBargainActivityApi.BargainActivity>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getBargainActivity(data.id);
      await nextTick();
      // 设置表单值时，价格字段从分转换为元
      await formApi.setValues({
        ...formData.value,
        bargainFirstPrice: (formData.value.bargainFirstPrice || 0) / 100,
        bargainMinPrice: (formData.value.bargainMinPrice || 0) / 100,
        randomMinPrice: formData.value.randomMinPrice
          ? formData.value.randomMinPrice / 100
          : undefined,
        randomMaxPrice: formData.value.randomMaxPrice
          ? formData.value.randomMaxPrice / 100
          : undefined,
      });
      // 加载商品和 SKU 信息
      if (formData.value.spuId) {
        const spu = await getSpu(formData.value.spuId);
        if (spu) {
          spuId.value = spu.id;
          spuName.value = spu.name || '';
          if (formData.value.skuId) {
            const selectedSku = spu.skus?.find(
              (sku) => sku.id === formData.value?.skuId,
            );
            if (selectedSku) {
              skuId.value = selectedSku.id;
              skuInfo.value = {
                skuName: selectedSku.name || '',
                picUrl: selectedSku.picUrl || spu.picUrl || '',
                price: Number(selectedSku.price) || 0,
              };
            }
          }
        }
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-3/5" :title="getTitle">
    <div class="mx-4">
      <Form />

      <!-- 商品选择区域 -->
      <div class="mt-4">
        <div class="mb-2 flex items-center">
          <span class="text-sm font-medium">砍价活动商品:</span>
          <Button class="ml-2" type="primary" @click="handleSelectProduct">
            选择商品
          </Button>
          <span v-if="spuName" class="ml-4 text-sm text-gray-600">
            已选择: {{ spuName }}
          </span>
        </div>

        <!-- SKU 信息展示 -->
        <div v-if="skuInfo" class="mt-4">
          <table class="w-full border-collapse border border-gray-300">
            <!-- TODO @puhui999：和 element-plus 有点差别哈；ps：是不是用 grid 组件呀？或者 vxe 组件
             图片
颜色
版本
商品条码
销售价(元)
市场价(元)
成本价(元)
库存
砍价起始价格(元)
砍价底价(元)
活动库存
             -->
            <thead>
              <tr class="bg-gray-100">
                <th class="border border-gray-300 px-4 py-2">商品图片</th>
                <th class="border border-gray-300 px-4 py-2">SKU 名称</th>
                <th class="border border-gray-300 px-4 py-2">原价(元)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 px-4 py-2 text-center">
                  <img
                    v-if="skuInfo.picUrl"
                    :src="skuInfo.picUrl"
                    alt="商品图片"
                    class="h-16 w-16 object-cover"
                  />
                </td>
                <td class="border border-gray-300 px-4 py-2">
                  {{ skuInfo.skuName }}
                </td>
                <td class="border border-gray-300 px-4 py-2 text-center">
                  ¥{{ (skuInfo.price / 100).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Modal>

  <!-- 商品选择器弹窗（单选模式） -->
  <SpuSkuSelect
    ref="spuSkuSelectRef"
    :is-select-sku="true"
    :radio="true"
    @select="handleSpuSelected"
  />
</template>
