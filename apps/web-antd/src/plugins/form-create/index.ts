import type { App } from 'vue';

import { getCurrentInstance } from 'vue';

import formCreate from '@form-create/ant-design-vue';
import install from '@form-create/ant-design-vue/auto-import';
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
} from 'ant-design-vue';

// ======================= 自定义组件 =======================
import { useApiSelect } from '#/components/form-create';
import AreaSelect from '#/components/form-create/components/area-select.vue';
import DeptSelect from '#/components/form-create/components/dept-select.vue';
import DictSelect from '#/components/form-create/components/dict-select.vue';
import IframeComponent from '#/components/form-create/components/iframe.vue';
import { useImagesUpload } from '#/components/form-create/components/use-images-upload';
import { Tinymce } from '#/components/tinymce';
import { FileUpload, ImageUpload } from '#/components/upload';

// 设计器提供的签名、表格表单等组件（FcEditor、FcTitle、SignaturePad、TableForm、FcTable），渲染设计器生成的表单需要，无需加载整个设计器
import '@form-create/antd-designer/dist/components.es.js';

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

formCreate.use(install);

const installedApps = new WeakSet<App>(); // 已安装 form-create 的应用

// 参考 https://www.form-create.com/v3/ant-design-vue/auto-import 文档
export function setupFormCreate(app: App) {
  if (installedApps.has(app)) {
    return;
  }
  installedApps.add(app);
  components.forEach((component) => {
    app.component(component.name as string, component);
  });
  app.component('AMessage', message);
  app.use(formCreate);
}

/**
 * 按需安装 form-create：在使用 form-create 的组件 setup 中同步调用，保证渲染表单前已注册
 *
 * 注意：不在 bootstrap 启动时安装，避免 form-create 进入登录、普通列表等首屏
 */
export function useFormCreate() {
  const instance = getCurrentInstance();
  if (instance) {
    setupFormCreate(instance.appContext.app);
  }
}
