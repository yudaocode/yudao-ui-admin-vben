/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { MallSpuApi } from '#/api/mall/product/spu';

// TODO @puhui999：这个是不是 api 后端有定义类似的？如果是，是不是放到 api 哈？
export interface PropertyAndValues {
  id: number;
  name: string;
  values?: PropertyAndValues[];
}

export interface RuleConfig {
  // 需要校验的字段
  // 例：name: 'name' 则表示校验 sku.name 的值
  // 例：name: 'productConfig.stock' 则表示校验 sku.productConfig.name 的值,此处 productConfig 表示我在 Sku 上扩展的属性
  name: string;
  // 校验规格为一个毁掉函数，其中 arg 为需要校验的字段的值。
  // 例：需要校验价格必须大于0.01
  // {
  //  name:'price',
  //  rule:(arg: number) => arg > 0.01
  // }
  rule: (arg: any) => boolean;
  // 校验不通过时的消息提示
  message: string;
}

// TODO @puhui999：这个是只有 index.ts 在用么？还是别的模块也会用
/** 获得商品的规格列表 - 商品相关的公共函数 */
const getPropertyList = (spu: MallSpuApi.Spu): PropertyAndValues[] => {
  //  直接拿返回的 skus 属性逆向生成出 propertyList
  const properties: PropertyAndValues[] = [];
  // 只有是多规格才处理
  if (spu.specType) {
    spu.skus?.forEach((sku) => {
      sku.properties?.forEach(
        ({ propertyId, propertyName, valueId, valueName }) => {
          // 添加属性
          if (!properties?.some((item) => item.id === propertyId)) {
            properties.push({
              id: propertyId!,
              name: propertyName!,
              values: [],
            });
          }
          // 添加属性值
          const index = properties?.findIndex((item) => item.id === propertyId);
          if (
            !properties[index]?.values?.some((value) => value.id === valueId)
          ) {
            properties[index]?.values?.push({ id: valueId!, name: valueName! });
          }
        },
      );
    });
  }
  return properties;
};

export { getPropertyList };

// 导出组件
// TODO @puhui999：如果 sku-list.vue 要对外，可以考虑在 spu 下面，搞个 components 模块；（目前看，别的模块应该会用到哈。）；modules 是当前模块用到的，components 是跨模块要用到的。
export { default as SkuList } from './modules/sku-list.vue';
