<script lang="ts" setup>
import type { MallSpuApi } from '#/api/mall/product/spu';
import type { MallBargainActivityApi } from '#/api/mall/promotion/bargain/bargainActivity';
import type {
  RuleConfig,
  SpuProperty,
} from '#/views/mall/product/spu/components';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { cloneDeep, convertToInteger, formatToFraction } from '@vben/utils';

import { ElButton, ElInputNumber, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { VxeColumn } from '#/adapter/vxe-table';
import { getSpu } from '#/api/mall/product/spu';
import {
  createBargainActivity,
  getBargainActivity,
  updateBargainActivity,
} from '#/api/mall/promotion/bargain/bargainActivity';
import { $t } from '#/locales';
import {
  getPropertyList,
  SpuAndSkuList,
  SpuSkuSelect,
} from '#/views/mall/product/spu/components';

import { useFormSchema } from '../data';

defineOptions({ name: 'PromotionBargainActivityForm' });

const emit = defineEmits(['success']);

const formData = ref<MallBargainActivityApi.BargainActivity>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['砍价活动'])
    : $t('ui.actionTitle.create', ['砍价活动']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 130,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

// ================= 商品选择相关 =================

const spuSkuSelectRef = ref(); // 商品和属性选择 Ref
const spuAndSkuListRef = ref(); // SPU 和 SKU 列表组件 Ref

const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.bargainFirstPrice',
    rule: (arg) => arg > 0,
    message: '商品砍价起始价格必须大于 0 ！！！',
  },
  {
    name: 'productConfig.bargainMinPrice',
    rule: (arg) => arg >= 0,
    message: '商品砍价底价不能小于 0 ！！！',
  },
  {
    name: 'productConfig.stock',
    rule: (arg) => arg >= 1,
    message: '商品活动库存必须大于等于 1 ！！！',
  },
];

const spuList = ref<MallSpuApi.Spu[]>([]); // 选择的 SPU 列表
const spuPropertyList = ref<SpuProperty<MallSpuApi.Spu>[]>([]); // SPU 属性列表

/** 打开商品选择器 */
function openSpuSelect() {
  spuSkuSelectRef.value?.open();
}

/** 选择商品后的回调 */
async function handleSpuSelected(spuId: number, skuIds?: number[]) {
  await formApi.setFieldValue('spuId', spuId);
  await getSpuDetails(spuId, skuIds);
}

/** 获取 SPU 详情 */
async function getSpuDetails(
  spuId: number,
  skuIds?: number[],
  products?: MallBargainActivityApi.BargainProduct[],
) {
  const res = await getSpu(spuId);
  if (!res) {
    return;
  }

  spuList.value = [];

  // 筛选指定的 SKU（砍价活动只选择一个 SKU）
  const selectSkus =
    skuIds === undefined
      ? res.skus
      : res.skus?.filter((sku) => skuIds.includes(sku.id!));

  // 为每个 SKU 配置砍价活动相关的配置
  selectSkus?.forEach((sku) => {
    let config: MallBargainActivityApi.BargainProduct = {
      spuId: res.id!,
      skuId: sku.id!,
      bargainFirstPrice: 1,
      bargainMinPrice: 1,
      stock: 1,
    };
    // 如果是编辑模式，回填已有配置
    if (products !== undefined) {
      const product = products.find((item) => item.skuId === sku.id);
      if (product) {
        // 分转元
        product.bargainFirstPrice = formatToFraction(
          product.bargainFirstPrice,
        ) as unknown as number;
        product.bargainMinPrice = formatToFraction(
          product.bargainMinPrice,
        ) as unknown as number;
      }
      config = product || config;
    }
    // 动态添加 productConfig 属性到 SKU
    (
      sku as MallSpuApi.Sku & {
        productConfig: MallBargainActivityApi.BargainProduct;
      }
    ).productConfig = config;
  });
  res.skus = selectSkus;

  const spuProperties: SpuProperty<MallSpuApi.Spu>[] = [
    {
      spuId: res.id!,
      spuDetail: res,
      propertyList: getPropertyList(res),
    },
  ];

  // 直接赋值，因为砍价活动只选择一个 SPU
  spuList.value = [res];
  spuPropertyList.value = spuProperties;
}

// ================= end =================

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    try {
      // 获取砍价商品配置（深拷贝避免直接修改原对象）
      const products: MallBargainActivityApi.BargainProduct[] = cloneDeep(
        spuAndSkuListRef.value?.getSkuConfigs('productConfig') || [],
      );
      if (products.length === 0) {
        ElMessage.error('请选择砍价商品');
        return;
      }
      // 价格需要转为分
      products.forEach((item) => {
        item.bargainFirstPrice = convertToInteger(item.bargainFirstPrice);
        item.bargainMinPrice = convertToInteger(item.bargainMinPrice);
      });

      // 提交表单
      const values = await formApi.getValues();
      const data = {
        ...values,
        // 用户每次砍价金额元转分
        randomMinPrice: values.randomMinPrice
          ? convertToInteger(values.randomMinPrice)
          : undefined,
        randomMaxPrice: values.randomMaxPrice
          ? convertToInteger(values.randomMaxPrice)
          : undefined,
        // 合并砍价商品配置（砍价活动只有一个商品）
        ...products[0],
      } as MallBargainActivityApi.BargainActivity;

      await (formData.value?.id
        ? updateBargainActivity(data)
        : createBargainActivity(data));
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
      spuList.value = [];
      spuPropertyList.value = [];
      return;
    }

    // 加载数据
    const data = modalApi.getData<MallBargainActivityApi.BargainActivity>();
    if (!data || !data.id) {
      return;
    }
    // 加载数据
    modalApi.lock();
    try {
      formData.value = await getBargainActivity(data.id);
      // 对齐活动商品处理结构
      await getSpuDetails(
        formData.value.spuId,
        [formData.value.skuId],
        [
          {
            spuId: formData.value.spuId,
            skuId: formData.value.skuId,
            bargainFirstPrice: formData.value.bargainFirstPrice, // 砍价起始价格，单位分
            bargainMinPrice: formData.value.bargainMinPrice, // 砍价底价
            stock: formData.value.stock, // 活动库存
          },
        ],
      );
      // 设置表单值时，价格字段从分转换为元
      await formApi.setValues({
        ...formData.value,
        randomMinPrice: formData.value.randomMinPrice
          ? formatToFraction(formData.value.randomMinPrice)
          : undefined,
        randomMaxPrice: formData.value.randomMaxPrice
          ? formatToFraction(formData.value.randomMaxPrice)
          : undefined,
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <div>
    <Modal :title="getTitle" class="w-[70%]">
      <Form class="mx-4">
        <!-- 商品选择 -->
        <template #spuId>
          <div class="w-full">
            <ElButton
              v-if="!formData?.id"
              type="primary"
              @click="openSpuSelect"
            >
              选择商品
            </ElButton>

            <!-- SPU 和 SKU 列表展示 -->
            <SpuAndSkuList
              ref="spuAndSkuListRef"
              :rule-config="ruleConfig"
              :spu-list="spuList"
              :spu-property-list-p="spuPropertyList"
              class="mt-4"
            >
              <!-- 扩展列：砍价活动特有配置 -->
              <template #default>
                <VxeColumn
                  align="center"
                  min-width="168"
                  title="砍价起始价格(元)"
                >
                  <template #default="{ row: sku }">
                    <ElInputNumber
                      v-model="sku.productConfig.bargainFirstPrice"
                      :min="0"
                      :precision="2"
                      :step="0.1"
                      class="w-full"
                      controls-position="right"
                    />
                  </template>
                </VxeColumn>
                <VxeColumn align="center" min-width="168" title="砍价底价(元)">
                  <template #default="{ row: sku }">
                    <ElInputNumber
                      v-model="sku.productConfig.bargainMinPrice"
                      :min="0"
                      :precision="2"
                      :step="0.1"
                      class="w-full"
                      controls-position="right"
                    />
                  </template>
                </VxeColumn>
                <VxeColumn align="center" min-width="168" title="活动库存">
                  <template #default="{ row: sku }">
                    <ElInputNumber
                      v-model="sku.productConfig.stock"
                      :max="sku.stock"
                      :min="0"
                      class="w-full"
                      controls-position="right"
                    />
                  </template>
                </VxeColumn>
              </template>
            </SpuAndSkuList>
          </div>
        </template>
      </Form>
    </Modal>

    <!-- 商品选择器弹窗（单选模式） -->
    <SpuSkuSelect
      ref="spuSkuSelectRef"
      :is-select-sku="true"
      :radio="true"
      @select="handleSpuSelected"
    />
  </div>
</template>
