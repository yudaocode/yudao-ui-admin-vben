<script lang="ts" setup>
import type { MallSpuApi } from '#/api/mall/product/spu';
import type { MallDiscountActivityApi } from '#/api/mall/promotion/discount/discountActivity';
import type {
  PropertyAndValues,
  RuleConfig,
  SpuProperty,
} from '#/views/mall/product/spu/components';

import { computed, nextTick, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';
import { PromotionDiscountTypeEnum } from '@vben/constants';
import {
  cloneDeep,
  convertToInteger,
  erpCalculatePercentage,
  formatToFraction,
  yuanToFen,
} from '@vben/utils';

import { Button, InputNumber, message } from 'ant-design-vue';

import { VxeColumn } from '#/adapter/vxe-table';
import { getSpuDetailList } from '#/api/mall/product/spu';
import {
  createDiscountActivity,
  getDiscountActivity,
  updateDiscountActivity,
} from '#/api/mall/promotion/discount/discountActivity';
import { $t } from '#/locales';
import {
  getPropertyList,
  SpuAndSkuList,
  SpuSkuSelect,
} from '#/views/mall/product/spu/components';

import { useFormSchema } from '../data';

defineOptions({ name: 'DiscountActivityForm' });

const emit = defineEmits(['success']);

// ================= 表单相关 =================
const formData = ref<Partial<MallDiscountActivityApi.DiscountActivity>>({});
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['限时折扣活动'])
    : $t('ui.actionTitle.create', ['限时折扣活动']);
});

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

// ================= 商品选择相关 =================
/** SKU 扩展类型 */
interface SkuExtension extends MallSpuApi.Sku {
  productConfig: MallDiscountActivityApi.DiscountProduct;
}

/** SPU 扩展类型 */
interface SpuExtension extends MallSpuApi.Spu {
  skus?: SkuExtension[];
}

const spuSelectRef = ref(); // 商品选择组件 Ref
const spuAndSkuListRef = ref(); // SKU 列表组件 Ref
const spuList = ref<SpuExtension[]>([]); // 选择的 SPU 列表
const spuPropertyList = ref<SpuProperty<SpuExtension>[]>([]); // SPU 属性列表
const spuIdList = ref<number[]>([]); // 已选择的 SPU ID 列表

/** SKU 校验规则配置 */
const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.discountPrice',
    rule: (arg) => arg > 0,
    message: '商品优惠金额不能为 0 ！！！',
  },
];

/** 打开商品选择弹窗 */
function openSpuSelect() {
  spuSelectRef.value?.open();
}

/** 选择商品后的回调 */
function handleSpuSelected(spuId: number, skuIds?: number[]) {
  getSpuDetails(spuId, skuIds);
}

/** 获取 SPU 详情 */
async function getSpuDetails(
  spuId: number,
  skuIdArr?: number[],
  products?: MallDiscountActivityApi.DiscountProduct[],
  type?: string,
) {
  // 如果已经包含该 SPU 则跳过
  if (spuIdList.value.includes(spuId)) {
    if (type !== 'load') {
      message.error('数据重复选择！');
    }
    return;
  }
  spuIdList.value.push(spuId);

  const res = (await getSpuDetailList([spuId])) as SpuExtension[];
  if (res.length === 0) {
    return;
  }

  const spu = res[0]!;
  // 筛选 SKU
  const selectSkus =
    skuIdArr === undefined
      ? spu.skus
      : spu.skus?.filter((sku) => skuIdArr.includes(sku.id!));

  // 为每个 SKU 添加折扣配置
  selectSkus?.forEach((sku) => {
    let config: MallDiscountActivityApi.DiscountProduct = {
      skuId: sku.id!,
      spuId: spu.id!,
      discountType: 1,
      discountPercent: 0,
      discountPrice: 0,
    };

    // 编辑时，使用已有的配置
    if (products !== undefined) {
      const product = products.find((item) => item.skuId === sku.id);
      if (product) {
        // 转换为元显示
        config = {
          ...product,
          discountPercent: Number(formatToFraction(product.discountPercent)),
          discountPrice: Number(formatToFraction(product.discountPrice)),
        };
      }
    }
    (sku as SkuExtension).productConfig = config;
  });

  spu.skus = selectSkus as SkuExtension[];
  spuPropertyList.value.push({
    spuId: spu.id!,
    spuDetail: spu,
    propertyList: getPropertyList(spu) as PropertyAndValues[],
  });
  spuList.value.push(spu);
}

/** 删除 SPU */
function handleDeleteSpu(spuId: number) {
  const spuIndex = spuIdList.value.indexOf(spuId);
  if (spuIndex !== -1) {
    spuIdList.value.splice(spuIndex, 1);
  }
  const propertyIndex = spuPropertyList.value.findIndex(
    (item) => item.spuId === spuId,
  );
  if (propertyIndex !== -1) {
    spuPropertyList.value.splice(propertyIndex, 1);
  }
  const listIndex = spuList.value.findIndex((item) => item.id === spuId);
  if (listIndex !== -1) {
    spuList.value.splice(listIndex, 1);
  }
}

/** 处理 SKU 优惠金额变动 */
function handleSkuDiscountPriceChange(row: SkuExtension) {
  if (row.productConfig.discountPrice <= 0) {
    return;
  }
  // 设置优惠类型：满减
  row.productConfig.discountType = PromotionDiscountTypeEnum.PRICE.type;
  // 计算折扣百分比
  const price = typeof row.price === 'number' ? row.price : Number(row.price);
  const percent = erpCalculatePercentage(
    price - yuanToFen(row.productConfig.discountPrice),
    price,
  );
  row.productConfig.discountPercent =
    typeof percent === 'number' ? percent : Number(percent);
}

/** 处理 SKU 折扣百分比变动 */
function handleSkuDiscountPercentChange(row: SkuExtension) {
  if (
    row.productConfig.discountPercent <= 0 ||
    row.productConfig.discountPercent >= 100
  ) {
    return;
  }
  // 设置优惠类型：折扣
  row.productConfig.discountType = PromotionDiscountTypeEnum.PERCENT.type;
  // 计算优惠金额
  const price = typeof row.price === 'number' ? row.price : Number(row.price);
  row.productConfig.discountPrice = Number(
    formatToFraction(price - price * (row.productConfig.discountPercent / 100)),
  );
}

/** 重置表单 */
async function resetForm() {
  spuList.value = [];
  spuPropertyList.value = [];
  spuIdList.value = [];
  formData.value = {};
  await nextTick();
  await formApi.resetForm();
}

// ================= 弹窗相关 =================
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 校验是否选择了商品
    if (spuList.value.length === 0) {
      message.warning('请选择活动商品');
      return;
    }
    modalApi.lock();
    // 提交表单
    try {
      // 获取折扣商品配置
      const products = cloneDeep(
        spuAndSkuListRef.value?.getSkuConfigs('productConfig') || [],
      ) as MallDiscountActivityApi.DiscountProduct[];
      // 转换金额为分
      products.forEach((item) => {
        item.discountPercent = convertToInteger(item.discountPercent);
        item.discountPrice = convertToInteger(item.discountPrice);
      });
      const data = cloneDeep(
        await formApi.getValues(),
      ) as MallDiscountActivityApi.DiscountActivity;
      data.products = products;
      // 提交请求
      await (formData.value?.id
        ? updateDiscountActivity(data)
        : createDiscountActivity(data));
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
      await resetForm();
      return;
    }
    // 加载数据
    const data = modalApi.getData<MallDiscountActivityApi.DiscountActivity>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      const activityData = await getDiscountActivity(data.id);
      formData.value = activityData;
      // 加载商品详情
      if (activityData.products && activityData.products.length > 0) {
        // 按 spuId 分组
        const spuProductsMap = new Map<
          number,
          MallDiscountActivityApi.DiscountProduct[]
        >();
        for (const product of activityData.products) {
          const spuId = product.spuId;
          if (!spuProductsMap.has(spuId)) {
            spuProductsMap.set(spuId, []);
          }
          spuProductsMap.get(spuId)!.push(product);
        }
        // 加载每个 SPU 的详情
        for (const [spuId, products] of spuProductsMap) {
          const skuIdArr = products.map((p) => p.skuId);
          await getSpuDetails(spuId, skuIdArr, products, 'load');
        }
      }
      // 设置到 values
      await formApi.setValues(activityData);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-[70%]" :title="getTitle">
    <Form>
      <!-- 自定义插槽：商品选择 -->
      <template #spuIds>
        <div class="w-full">
          <Button class="mb-4" @click="openSpuSelect">选择商品</Button>
          <SpuAndSkuList
            ref="spuAndSkuListRef"
            :deletable="true"
            :rule-config="ruleConfig"
            :spu-list="spuList"
            :spu-property-list-p="spuPropertyList"
            @delete="handleDeleteSpu"
          >
            <!-- 扩展列：限时折扣活动特有配置 -->
            <template #default>
              <VxeColumn align="center" min-width="168" title="优惠金额(元)">
                <template #default="{ row }">
                  <InputNumber
                    v-model:value="row.productConfig.discountPrice"
                    :max="Number(formatToFraction(row.price))"
                    :min="0"
                    :precision="2"
                    :step="0.1"
                    class="w-full"
                    @change="handleSkuDiscountPriceChange(row)"
                  />
                </template>
              </VxeColumn>
              <VxeColumn align="center" min-width="168" title="折扣百分比(%)">
                <template #default="{ row }">
                  <InputNumber
                    v-model:value="row.productConfig.discountPercent"
                    :max="100"
                    :min="0"
                    :precision="2"
                    :step="0.1"
                    class="w-full"
                    @change="handleSkuDiscountPercentChange(row)"
                  />
                </template>
              </VxeColumn>
            </template>
          </SpuAndSkuList>
        </div>
      </template>
    </Form>
  </Modal>

  <!-- 商品选择弹窗 -->
  <SpuSkuSelect
    ref="spuSelectRef"
    :is-select-sku="true"
    @select="handleSpuSelected"
  />
</template>
