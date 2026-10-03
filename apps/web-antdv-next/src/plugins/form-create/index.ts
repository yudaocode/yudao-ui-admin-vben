/* eslint-disable vue/one-component-per-file */

import type { DropdownProps } from 'antdv-next';

import type { App, Slots } from 'vue';

import { defineComponent, h } from 'vue';

import FcDesigner from '@form-create/antd-designer';
import formCreate from '@form-create/antdv-next';
import install from '@form-create/antdv-next/auto-import';
// 使用 form-create 需额外全局引入 antdv-next 组件
import {
  Alert,
  Badge,
  Card,
  Collapse,
  CollapsePanel,
  ConfigProvider,
  Divider,
  Dropdown,
  Image,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  LayoutSider,
  Menu,
  MenuDivider,
  MenuItem,
  message,
  Modal,
  Popconfirm,
  Table,
  TableColumn,
  TabPane,
  Tabs,
  Tag,
  Transfer,
} from 'antdv-next';

// ======================= 自定义组件 =======================
import { useApiSelect } from '#/components/form-create';
import AreaSelect from '#/components/form-create/components/area-select.vue';
import DeptSelect from '#/components/form-create/components/dept-select.vue';
import DictSelect from '#/components/form-create/components/dict-select.vue';
import IframeComponent from '#/components/form-create/components/iframe.vue';
import { useImagesUpload } from '#/components/form-create/components/use-images-upload';
import { Tinymce } from '#/components/tinymce';
import { FileUpload, ImageUpload } from '#/components/upload';

const UserSelect = useApiSelect({
  name: 'UserSelect',
  labelField: 'nickname',
  valueField: 'id',
  url: '/system/user/simple-list',
});
const ApiSelect = useApiSelect({
  name: 'ApiSelect',
});
const ImagesUpload = useImagesUpload();

// ======================= 设计器兼容 =======================
// @form-create/antd-designer 基于 ant-design-vue 编写，这里补齐 antdv-next 中缺失或不兼容的组件
/** 只透传函数插槽，过滤掉编译产物中的 `_`、`__` 等内部标记 */
function pickFunctionSlots(slots: Slots) {
  return Object.fromEntries(
    Object.entries(slots).filter(([, slot]) => typeof slot === 'function'),
  );
}
/** antdv-next 没有 FormItemRest，设计器的配置面板仅用它包裹内容，直接透传即可 */
const FormItemRest = defineComponent({
  name: 'AFormItemRest',
  setup: (_props, { slots }) => {
    return () => slots.default?.();
  },
});
/** antdv-next 的 Dropdown 只接受数组形式的 trigger，设计器传入的是字符串 */
const DropdownCompat = defineComponent({
  name: Dropdown.name,
  inheritAttrs: false,
  setup: (_props, { attrs, slots }) => {
    return () => {
      const trigger = attrs.trigger as DropdownProps['trigger'] | string;
      return h(
        Dropdown,
        typeof trigger === 'string'
          ? { ...attrs, trigger: [trigger] as DropdownProps['trigger'] }
          : attrs,
        pickFunctionSlots(slots),
      );
    };
  },
});
/** antdv-next 的 Modal 已将 destroyOnClose 更名为 destroyOnHidden（需先于 auto-import 注册才能生效） */
const ModalCompat = defineComponent({
  name: Modal.name,
  inheritAttrs: false,
  setup: (_props, { attrs, slots }) => {
    return () => {
      const {
        destroyOnClose,
        'destroy-on-close': kebabDestroyOnClose,
        ...restAttrs
      } = attrs;
      const destroyOnHidden = destroyOnClose ?? kebabDestroyOnClose;
      return h(
        Modal,
        destroyOnHidden === undefined
          ? restAttrs
          : { destroyOnHidden, ...restAttrs },
        pickFunctionSlots(slots),
      );
    };
  },
});

const components = [
  Alert,
  Badge,
  Card,
  Collapse,
  CollapsePanel,
  ConfigProvider,
  Divider,
  DropdownCompat,
  FormItemRest,
  Image,
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  LayoutSider,
  Menu,
  MenuDivider,
  MenuItem,
  ModalCompat,
  Popconfirm,
  Table,
  TableColumn,
  TabPane,
  Tabs,
  Tag,
  Transfer,
  UserSelect,
  DeptSelect,
  ApiSelect,
  ImagesUpload,
  DictSelect,
  Tinymce,
  ImageUpload,
  FileUpload,
  IframeComponent,
  AreaSelect,
];

// 参考 form-create antdv-next auto-import 文档
export function setupFormCreate(app: App) {
  components.forEach((component) => {
    app.component(component.name as string, component);
  });
  app.component('AMessage', message);
  formCreate.use(install);
  app.use(formCreate);
  app.use(FcDesigner);
}
