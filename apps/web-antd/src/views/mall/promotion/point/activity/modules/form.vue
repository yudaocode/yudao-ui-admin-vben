<script lang="ts" setup>
import type { MallPointActivityApi } from '#/api/mall/promotion/point';
import type { RuleConfig } from '#/views/mall/product/spu/form';
import type { SpuProperty } from '#/views/mall/promotion/components/types';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { convertToInteger, formatToFraction } from '@vben/utils';

import { Button, InputNumber, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { VxeColumn } from '#/adapter/vxe-table';
import { getSpu } from '#/api/mall/product/spu';
import {
  createPointActivity,
  getPointActivity,
  updatePointActivity,
} from '#/api/mall/promotion/point';
import { $t } from '#/locales';
import { getPropertyList } from '#/views/mall/product/spu/form';

import { SpuAndSkuList, SpuSkuSelect } from '../../../components';
import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const formData = ref<MallPointActivityApi.PointActivity>(); // 用于存储当前编辑的数据
const isFormUpdate = ref(false); // 是否为编辑模式

const getTitle = computed(() =>
  isFormUpdate.value ? '编辑积分活动' : '新增积分活动',
);

// 1. 使用 useVbenForm 初始化表单
const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

// ================= 商品选择相关 =================

const spuSkuSelectRef = ref(); // 商品和属性选择 Ref
const spuAndSkuListRef = ref(); // SPU 和 SKU 列表组件 Ref

// SKU 规则配置
const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.stock',
    rule: (arg) => arg >= 1,
    message: '商品可兑换库存必须大于等于 1 ！！！',
  },
  {
    name: 'productConfig.point',
    rule: (arg) => arg >= 1,
    message: '商品所需兑换积分必须大于等于 1 ！！！',
  },
  {
    name: 'productConfig.count',
    rule: (arg) => arg >= 1,
    message: '商品可兑换次数必须大于等于 1 ！！！',
  },
];

const spuList = ref<any[]>([]); // 选择的 SPU 列表
const spuPropertyList = ref<SpuProperty<any>[]>([]); // SPU 属性列表

/**
 * 打开商品选择器
 */
function openSpuSelect() {
  spuSkuSelectRef.value.open();
}

/**
 * 选择商品后的回调
 */
async function handleSpuSelected(spuId: number, skuIds?: number[]) {
  await formApi.setFieldValue('spuId', spuId);
  await getSpuDetails(spuId, skuIds);
}

/**
 * 获取 SPU 详情
 */
async function getSpuDetails(
  spuId: number,
  skuIds?: number[],
  products?: MallPointActivityApi.PointProduct[],
) {
  const spuProperties: SpuProperty<any>[] = [];
  const res = await getSpu(spuId);

  if (!res) {
    return;
  }

  spuList.value = [];

  // 筛选指定的 SKU
  const selectSkus =
    skuIds === undefined
      ? res.skus
      : res.skus?.filter((sku) => skuIds.includes(sku.id!));

  // 为每个 SKU 配置积分商城相关的配置
  selectSkus?.forEach((sku: any) => {
    let config: MallPointActivityApi.PointProduct = {
      skuId: sku.id!,
      stock: 0,
      price: 0,
      point: 0,
      count: 0,
    };

    // 如果是编辑模式，回填已有配置
    if (products !== undefined) {
      const product = products.find((item) => item.skuId === sku.id);
      if (product) {
        product.price = formatToFraction(product.price) as unknown as number;
      }
      config = product || config;
    }

    sku.productConfig = config;
  });

  res.skus = selectSkus;

  spuProperties.push({
    spuId: res.id!,
    spuDetail: res,
    propertyList: getPropertyList(res),
  });

  spuList.value.push(res);
  spuPropertyList.value = spuProperties;
}

// ================= end =================

// 2. 使用 useVbenModal 定义弹窗行为
const [Modal, modalApi] = useVbenModal({
  // "确认"按钮的回调
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    modalApi.lock();
    try {
      // 获取积分商城商品配置
      const products: MallPointActivityApi.PointProduct[] =
        spuAndSkuListRef.value?.getSkuConfigs('productConfig') || [];

      // 价格需要转为分
      products.forEach((item) => {
        item.price = convertToInteger(item.price);
      });

      const data =
        (await formApi.getValues()) as MallPointActivityApi.PointActivity;
      data.products = products;

      // 真正提交
      await (isFormUpdate.value
        ? updatePointActivity(data)
        : createPointActivity(data));

      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  // 弹窗打开时的回调
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      // 关闭时清理状态
      formData.value = undefined;
      isFormUpdate.value = false;
      spuList.value = [];
      spuPropertyList.value = [];
      return;
    }

    const data = modalApi.getData();
    if (!data || !data.id) {
      // 新增模式
      isFormUpdate.value = false;
      return;
    }

    // 编辑模式
    isFormUpdate.value = true;
    modalApi.lock();

    try {
      formData.value = await getPointActivity(data.id);
      await getSpuDetails(
        formData.value.spuId,
        formData.value.products?.map((sku) => sku.skuId),
        formData.value.products,
      );
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[70%]">
    <Form>
      <!-- 商品选择 -->
      <template #spuId>
        <div class="w-full">
          <Button v-if="!isFormUpdate" type="primary" @click="openSpuSelect">
            选择商品
          </Button>

          <!-- SPU 和 SKU 列表展示 -->
          <SpuAndSkuList
            v-if="spuList.length > 0"
            ref="spuAndSkuListRef"
            :rule-config="ruleConfig"
            :spu-list="spuList"
            :spu-property-list="spuPropertyList"
            class="mt-4"
          >
            <!-- 扩展列：积分商城特有配置 -->
            <template #default>
              <VxeColumn align="center" min-width="168" title="可兑换库存">
                <template #default="{ row: sku }">
                  <InputNumber
                    v-model:value="sku.productConfig.stock"
                    :max="sku.stock"
                    :min="0"
                    class="w-full"
                  />
                </template>
              </VxeColumn>

              <VxeColumn align="center" min-width="168" title="可兑换次数">
                <template #default="{ row: sku }">
                  <InputNumber
                    v-model:value="sku.productConfig.count"
                    :min="0"
                    class="w-full"
                  />
                </template>
              </VxeColumn>

              <VxeColumn align="center" min-width="168" title="所需积分">
                <template #default="{ row: sku }">
                  <InputNumber
                    v-model:value="sku.productConfig.point"
                    :min="0"
                    class="w-full"
                  />
                </template>
              </VxeColumn>

              <VxeColumn align="center" min-width="168" title="所需金额(元)">
                <template #default="{ row: sku }">
                  <InputNumber
                    v-model:value="sku.productConfig.price"
                    :min="0"
                    :precision="2"
                    :step="0.1"
                    class="w-full"
                  />
                </template>
              </VxeColumn>
            </template>
          </SpuAndSkuList>
        </div>
      </template>
    </Form>

    <!-- 商品选择器弹窗 -->
    <SpuSkuSelect
      ref="spuSkuSelectRef"
      :is-select-sku="true"
      @confirm="handleSpuSelected"
    />
  </Modal>
</template>
