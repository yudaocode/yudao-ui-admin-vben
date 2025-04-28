import type { App } from 'vue';

// import install from '@form-create/ant-design-vue/auto-import';
import FcDesigner from '@form-create/antd-designer';
import Antd from 'ant-design-vue';

// ======================= 自定义组件 =======================
import { useApiSelect } from '#/components/form-create';
import DictSelect from '#/components/form-create/components/dict-select.vue';
import { useImagesUpload } from '#/components/form-create/components/use-images-upload';
import { Tinymce } from '#/components/tinymce';
import { FileUpload, ImageUpload } from '#/components/upload';

const UserSelect = useApiSelect({
  name: 'UserSelect',
  labelField: 'nickname',
  valueField: 'id',
  url: '/system/user/simple-list',
});
const DeptSelect = useApiSelect({
  name: 'DeptSelect',
  labelField: 'name',
  valueField: 'id',
  url: '/system/dept/simple-list',
});
const ApiSelect = useApiSelect({
  name: 'ApiSelect',
});
const ImagesUpload = useImagesUpload();

const components = [
  ImageUpload,
  ImagesUpload,
  FileUpload,
  Tinymce,
  DictSelect,
  UserSelect,
  DeptSelect,
  ApiSelect,
];

// TODO: @dhb52 按需导入，而不是app.use(Antd);
// 参考 http://www.form-create.com/v3/ant-design-vue/auto-import.html 文档
export const setupFormCreate = (app: App) => {
  components.forEach((component) => {
    app.component(component.name as string, component);
  });
  app.use(Antd);
  app.use(FcDesigner);
  app.use(FcDesigner.formCreate);
};
