import type { App } from 'vue';

import formCreate from '@form-create/ant-design-vue';
import install from '@form-create/ant-design-vue/auto-import';
import FcDesigner from '@form-create/antd-designer';
// 👇使用 form-create 需额外全局引入 ant-design-vue 组件
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

const components = [
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

// 参考 https://www.form-create.com/v3/ant-design-vue/auto-import 文档
export function setupFormCreate(app: App) {
  components.forEach((component) => {
    app.component(component.name as string, component);
  });
  app.component('AMessage', message);
  formCreate.use(install);
  app.use(formCreate);
  app.use(FcDesigner);
}
