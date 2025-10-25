export { default as DiyEditor } from './diy-editor/index.vue';
export { type DiyComponentLibrary, PAGE_LIBS } from './diy-editor/util';
export { default as SpuAndSkuList } from './spu-and-sku-list.vue';
export { default as SpuSkuSelect } from './spu-sku-select.vue';

export type * from './types';
// TODO @puhui999：这个要不要也放到 product/spu/components 下？相当于各种商品的 select 能力，统一由 spu 提供组件化能力！
