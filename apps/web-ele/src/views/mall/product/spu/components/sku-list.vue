<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PropertyAndValues, RuleConfig } from './model';

import type { MallSpuApi } from '#/api/mall/product/spu';

import { ref, watch } from 'vue';

import { formatToFraction, isEmpty } from '@vben/utils';

import { ElInput, ElMessage, ElTable } from 'element-plus';

import UploadImg from '#/components/upload/image-upload.vue';
import { copyValueToTarget } from '#/utils';

defineOptions({ name: 'SkuList' });

const props = defineProps({
  propFormData: {
    type: Object as PropType<MallSpuApi.Spu>,
    default: () => ({}),
  },
  propertyList: {
    type: Array as PropType<PropertyAndValues[]>,
    default: () => [],
  },
  ruleConfig: {
    type: Array as PropType<RuleConfig[]>,
    default: () => [],
  },
  isBatch: {
    type: Boolean,
    default: false,
  }, // 是否作为批量操作组件
  isComponent: {
    type: Boolean,
    default: false,
  }, // 是否作为组件
  isActivityComponent: {
    type: Boolean,
    default: false,
  }, // 是否作为活动组件
});

const emit = defineEmits<{
  (e: 'selectionChange', value: MallSpuApi.Sku[]): void;
}>();
const formData = ref<MallSpuApi.Spu>(); // 表单数据
const skuList = ref<MallSpuApi.Sku[]>([
  {
    price: 0, // 商品价格
    marketPrice: 0, // 市场价
    costPrice: 0, // 成本价
    barCode: '', // 商品条码
    picUrl: '', // 图片地址
    stock: 0, // 库存
    weight: 0, // 商品重量
    volume: 0, // 商品体积
    firstBrokeragePrice: 0, // 一级分销的佣金
    secondBrokeragePrice: 0, // 二级分销的佣金
  },
]); // 批量添加时的临时数据

/** 批量添加 */
const batchAdd = () => {
  validateProperty();
  formData.value!.skus!.forEach((item: MallSpuApi.Sku) => {
    copyValueToTarget(item, skuList.value[0]);
  });
};
/** 校验商品属性属性值 */
const validateProperty = () => {
  // 校验商品属性属性值是否为空，有一个为空都不给过
  const warningInfo = '存在属性属性值为空，请先检查完善属性值后重试！！！';
  for (const item of props.propertyList) {
    if (!item.values || isEmpty(item.values)) {
      ElMessage.warning(warningInfo);
      throw new Error(warningInfo);
    }
  }
};
/** 删除 sku */
const deleteSku = (row: MallSpuApi.Sku) => {
  const index = formData.value!.skus!.findIndex(
    // 直接把列表转成字符串比较
    (sku: MallSpuApi.Sku) =>
      JSON.stringify(sku.properties) === JSON.stringify(row.properties),
  );
  formData.value!.skus!.splice(index, 1);
};
const tableHeaders = ref<{ label: string; prop: string }[]>([]); // 多属性表头
/**
 * 保存时，每个商品规格的表单要校验下。例如说，销售金额最低是 0.01 这种。
 */
const validateSku = () => {
  validateProperty();
  let warningInfo = '请检查商品各行相关属性配置，';
  let validate = true; // 默认通过
  for (const sku of formData.value!.skus!) {
    // 作为活动组件的校验
    for (const rule of props?.ruleConfig) {
      const arg = getValue(sku, rule.name);
      if (!rule.rule(arg)) {
        validate = false; // 只要有一个不通过则直接不通过
        warningInfo += rule.message;
        break;
      }
    }
    // 只要有一个不通过则结束后续的校验
    if (!validate) {
      ElMessage.warning(warningInfo);
      throw new Error(warningInfo);
    }
  }
};
const getValue = (obj: any, arg: string) => {
  const keys = arg.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      value = undefined;
      break;
    }
  }
  return value;
};

/**
 * 选择时触发
 * @param Sku 传递过来的选中的 sku 是一个数组
 */
const handleSelectionChange = (val: MallSpuApi.Sku[]) => {
  emit('selectionChange', val);
};

/**
 * 将传进来的值赋值给 skuList
 */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) return;
    formData.value = data;
  },
  {
    deep: true,
    immediate: true,
  },
);

/** 生成表数据 */
const generateTableData = (propertyList: any[]) => {
  // 构建数据结构
  const propertyValues = propertyList.map((item) =>
    item.values.map((v: any) => ({
      propertyId: item.id,
      propertyName: item.name,
      valueId: v.id,
      valueName: v.name,
    })),
  );
  const buildSkuList = build(propertyValues);
  // 如果回显的 sku 属性和添加的属性不一致则重置 skus 列表
  if (!validateData(propertyList)) {
    // 如果不一致则重置表数据，默认添加新的属性重新生成 sku 列表
    formData.value!.skus = [];
  }
  if (buildSkuList && buildSkuList.length > 0) {
    for (const item of buildSkuList) {
      const row = {
        properties: Array.isArray(item) ? item : [item], // 如果只有一个属性的话返回的是一个 property 对象
        price: 0,
        marketPrice: 0,
        costPrice: 0,
        barCode: '',
        picUrl: '',
        stock: 0,
        weight: 0,
        volume: 0,
        firstBrokeragePrice: 0,
        secondBrokeragePrice: 0,
      };
      // 如果存在属性相同的 sku 则不做处理
      const index = formData.value!.skus!.findIndex(
        (sku: MallSpuApi.Sku) =>
          JSON.stringify(sku.properties) === JSON.stringify(row.properties),
      );
      if (index !== -1) {
        continue;
      }
      formData.value!.skus!.push(row);
    }
  }
};

/**
 * 生成 skus 前置校验
 */
const validateData = (propertyList: any[]) => {
  const skuPropertyIds: number[] = [];
  formData.value!.skus!.forEach((sku: MallSpuApi.Sku) =>
    sku.properties
      ?.map((property: any) => property.propertyId)
      ?.forEach((propertyId: number) => {
        if (!skuPropertyIds.includes(propertyId!)) {
          skuPropertyIds.push(propertyId!);
        }
      }),
  );
  const propertyIds = propertyList.map((item) => item.id);
  return skuPropertyIds.length === propertyIds.length;
};

/** 构建所有排列组合 */
const build = (
  propertyValuesList: MallSpuApi.Property[][],
): MallSpuApi.Property[] | MallSpuApi.Property[][] => {
  if (!propertyValuesList || propertyValuesList.length === 0) {
    return [];
  } else if (propertyValuesList.length === 1) {
    return propertyValuesList[0] || [];
  } else {
    const result: MallSpuApi.Property[][] = [];
    const rest = build(propertyValuesList.slice(1));
    if (propertyValuesList[0] && Array.isArray(rest)) {
      for (let i = 0; i < propertyValuesList[0].length; i++) {
        for (const restItem of rest) {
          const currentItem = propertyValuesList[0][i];
          // 第一次不是数组结构，后面的都是数组结构
          if (Array.isArray(restItem)) {
            result.push([currentItem!, ...restItem]);
          } else if (restItem) {
            // 确保restItem不是undefined，并进行类型断言
            result.push([currentItem!, restItem as MallSpuApi.Property]);
          }
        }
      }
    }
    return result;
  }
};

/** 监听属性列表，生成相关参数和表头 */
watch(
  () => props.propertyList,
  (propertyList: PropertyAndValues[]) => {
    // 如果不是多规格则结束
    if (!formData.value!.specType) {
      return;
    }
    // 如果当前组件作为批量添加数据使用，则重置表数据
    if (props.isBatch) {
      skuList.value = [
        {
          price: 0,
          marketPrice: 0,
          costPrice: 0,
          barCode: '',
          picUrl: '',
          stock: 0,
          weight: 0,
          volume: 0,
          firstBrokeragePrice: 0,
          secondBrokeragePrice: 0,
        },
      ];
    }

    // 判断代理对象是否为空
    if (JSON.stringify(propertyList) === '[]') {
      return;
    }
    // 重置表头
    tableHeaders.value = [];
    // 生成表头
    propertyList.forEach((item, index) => {
      // name加属性项index区分属性值
      tableHeaders.value.push({ prop: `name${index}`, label: item.name });
    });
    // 如果回显的 sku 属性和添加的属性一致则不处理
    if (validateData(propertyList)) {
      return;
    }
    // 添加新属性没有属性值也不做处理
    if (propertyList.some((item) => !item.values || isEmpty(item.values))) {
      return;
    }
    // 生成 table 数据，即 sku 列表
    generateTableData(propertyList);
  },
  {
    deep: true,
    immediate: true,
  },
);
const activitySkuListRef = ref<InstanceType<typeof ElTable>>();

const getSkuTableRef = () => {
  return activitySkuListRef.value;
};
// 暴露出生成 sku 方法，给添加属性成功时调用
defineExpose({ generateTableData, validateSku, getSkuTableRef });
</script>
<template>
  <!-- 情况一：添加/修改 -->
  <ElTable
    v-if="!isActivityComponent"
    :data="isBatch ? skuList : formData!.skus!"
    border
    class="tabNumWidth"
    max-height="500"
    size="small"
  >
    <el-table-column align="center" label="图片" min-width="120">
      <template #default="{ row }">
        <UploadImg
          v-model="row.picUrl"
          height="50px"
          width="50px"
          :show-description="false"
        />
      </template>
    </el-table-column>
    <template v-if="formData!.specType && !isBatch">
      <!--  根据商品属性动态添加 -->
      <el-table-column
        v-for="(item, index) in tableHeaders"
        :key="index"
        :label="item.label"
        align="center"
        min-width="120"
      >
        <template #default="{ row }">
          <span style="font-weight: bold; color: #40aaff">
            {{ row.properties?.[index]?.valueName }}
          </span>
        </template>
      </el-table-column>
    </template>
    <el-table-column align="center" label="商品条码" min-width="168">
      <template #default="{ row }">
        <ElInput v-model="row.barCode" class="w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="销售价" min-width="168">
      <template #default="{ row }">
        <el-input-number
          v-model="row.price"
          :min="0"
          :precision="2"
          :step="0.1"
          class="w-100%"
          controls-position="right"
        />
      </template>
    </el-table-column>
    <el-table-column align="center" label="市场价" min-width="168">
      <template #default="{ row }">
        <el-input-number
          v-model="row.marketPrice"
          :min="0"
          :precision="2"
          :step="0.1"
          class="w-100%"
          controls-position="right"
        />
      </template>
    </el-table-column>
    <el-table-column align="center" label="成本价" min-width="168">
      <template #default="{ row }">
        <el-input-number
          v-model="row.costPrice"
          :min="0"
          :precision="2"
          :step="0.1"
          class="w-100%"
          controls-position="right"
        />
      </template>
    </el-table-column>
    <el-table-column align="center" label="库存" min-width="168">
      <template #default="{ row }">
        <el-input-number
          v-model="row.stock"
          :min="0"
          class="w-100%"
          controls-position="right"
        />
      </template>
    </el-table-column>
    <el-table-column align="center" label="重量(kg)" min-width="168">
      <template #default="{ row }">
        <el-input-number
          v-model="row.weight"
          :min="0"
          :precision="2"
          :step="0.1"
          class="w-100%"
          controls-position="right"
        />
      </template>
    </el-table-column>
    <el-table-column align="center" label="体积(m^3)" min-width="168">
      <template #default="{ row }">
        <el-input-number
          v-model="row.volume"
          :min="0"
          :precision="2"
          :step="0.1"
          class="w-100%"
          controls-position="right"
        />
      </template>
    </el-table-column>
    <template v-if="formData!.subCommissionType">
      <el-table-column align="center" label="一级返佣(元)" min-width="168">
        <template #default="{ row }">
          <el-input-number
            v-model="row.firstBrokeragePrice"
            :min="0"
            :precision="2"
            :step="0.1"
            class="w-100%"
            controls-position="right"
          />
        </template>
      </el-table-column>
      <el-table-column align="center" label="二级返佣(元)" min-width="168">
        <template #default="{ row }">
          <el-input-number
            v-model="row.secondBrokeragePrice"
            :min="0"
            :precision="2"
            :step="0.1"
            class="w-100%"
            controls-position="right"
          />
        </template>
      </el-table-column>
    </template>
    <el-table-column
      v-if="formData?.specType"
      align="center"
      fixed="right"
      label="操作"
      width="80"
    >
      <template #default="{ row }">
        <el-button
          v-if="isBatch"
          link
          size="small"
          type="primary"
          @click="batchAdd"
        >
          批量添加
        </el-button>
        <el-button
          v-else
          link
          size="small"
          type="primary"
          @click="deleteSku(row)"
        >
          删除
        </el-button>
      </template>
    </el-table-column>
  </ElTable>

  <!-- 情况二：作为活动组件 -->
  <ElTable
    v-if="isActivityComponent"
    :data="formData!.skus!"
    border
    max-height="500"
    size="small"
    style="width: 99%"
  >
    <el-table-column v-if="isComponent" type="selection" width="45" />
    <el-table-column align="center" label="图片" min-width="80">
      <template #default="{ row }">
        <el-image :src="row.picUrl" class="h-60px w-60px" />
      </template>
    </el-table-column>
    <template v-if="formData!.specType">
      <!--  根据商品属性动态添加 -->
      <el-table-column
        v-for="(item, index) in tableHeaders"
        :key="index"
        :label="item.label"
        align="center"
        min-width="80"
      >
        <template #default="{ row }">
          <span style="font-weight: bold; color: #40aaff">
            {{ row.properties?.[index]?.valueName }}
          </span>
        </template>
      </el-table-column>
    </template>
    <el-table-column align="center" label="商品条码" min-width="100">
      <template #default="{ row }">
        {{ row.barCode }}
      </template>
    </el-table-column>
    <el-table-column align="center" label="销售价(元)" min-width="80">
      <template #default="{ row }">
        {{ formatToFraction(row.price) }}
      </template>
    </el-table-column>
    <el-table-column align="center" label="市场价(元)" min-width="80">
      <template #default="{ row }">
        {{ formatToFraction(row.marketPrice) }}
      </template>
    </el-table-column>
    <el-table-column align="center" label="成本价(元)" min-width="80">
      <template #default="{ row }">
        {{ formatToFraction(row.costPrice) }}
      </template>
    </el-table-column>
    <el-table-column align="center" label="库存" min-width="80">
      <template #default="{ row }">
        {{ row.stock }}
      </template>
    </el-table-column>
    <!--  方便扩展每个活动配置的属性不一样  -->
    <slot name="extension"></slot>
  </ElTable>
</template>
