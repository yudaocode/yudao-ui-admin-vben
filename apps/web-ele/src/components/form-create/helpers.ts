import type { Ref } from 'vue';

import type { Menu } from '#/components/form-create/typing';

import { nextTick, onMounted } from 'vue';

import { apiSelectRule } from '#/components/form-create/rules/data';

import {
  useDictSelectRule,
  useEditorRule,
  useSelectRule,
  useUploadFileRule,
  useUploadImageRule,
  useUploadImagesRule,
} from './rules';

export function makeRequiredRule() {
  return {
    type: 'Required',
    field: 'formCreate$required',
    title: '是否必填',
  };
}

export const localeProps = (
  t: (msg: string) => any,
  prefix: string,
  rules: any[],
) => {
  return rules.map((rule: { field: string; title: any }) => {
    if (rule.field === 'formCreate$required') {
      rule.title = t('props.required') || rule.title;
    } else if (rule.field && rule.field !== '_optionType') {
      rule.title = t(`components.${prefix}.${rule.field}`) || rule.title;
    }
    return rule;
  });
};

/**
 * 解析表单组件的  field, title 等字段（递归，如果组件包含子组件）
 *
 * @param rule  组件的生成规则 https://www.form-create.com/v3/guide/rule
 * @param fields 解析后表单组件字段
 * @param parentTitle  如果是子表单，子表单的标题，默认为空
 */
export const parseFormFields = (
  rule: Record<string, any>,
  fields: Array<Record<string, any>> = [],
  parentTitle: string = '',
) => {
  const { type, field, $required, title: tempTitle, children } = rule;
  if (field && tempTitle) {
    let title = tempTitle;
    if (parentTitle) {
      title = `${parentTitle}.${tempTitle}`;
    }
    let required = false;
    if ($required) {
      required = true;
    }
    fields.push({
      field,
      title,
      type,
      required,
    });
    // TODO 子表单 需要处理子表单字段
    // if (type === 'group' && rule.props?.rule && Array.isArray(rule.props.rule)) {
    //   // 解析子表单的字段
    //   rule.props.rule.forEach((item) => {
    //     parseFields(item, fieldsPermission, title)
    //   })
    // }
  }
  if (children && Array.isArray(children)) {
    children.forEach((rule) => {
      parseFormFields(rule, fields);
    });
  }
};

/**
 * 表单设计器增强 hook
 * 新增
 * - 文件上传
 * - 单图上传
 * - 多图上传
 * - 字典选择器
 * - 用户选择器
 * - 部门选择器
 * - 富文本
 */
export const useFormCreateDesigner = async (designer: Ref) => {
  const editorRule = useEditorRule();
  const uploadFileRule = useUploadFileRule();
  const uploadImageRule = useUploadImageRule();
  const uploadImagesRule = useUploadImagesRule();

  /**
   * 构建表单组件
   */
  const buildFormComponents = () => {
    // 移除自带的上传组件规则，使用 uploadFileRule、uploadImgRule、uploadImgsRule 替代
    designer.value?.removeMenuItem('upload');
    // 移除自带的富文本组件规则，使用 editorRule 替代
    designer.value?.removeMenuItem('fc-editor');
    const components = [
      editorRule,
      uploadFileRule,
      uploadImageRule,
      uploadImagesRule,
    ];
    components.forEach((component) => {
      // 插入组件规则
      designer.value?.addComponent(component);
      // 插入拖拽按钮到 `main` 分类下
      designer.value?.appendMenuItem('main', {
        icon: component.icon,
        name: component.name,
        label: component.label,
      });
    });
  };

  const userSelectRule = useSelectRule({
    name: 'UserSelect',
    label: '用户选择器',
    icon: 'icon-eye',
  });
  const deptSelectRule = useSelectRule({
    name: 'DeptSelect',
    label: '部门选择器',
    icon: 'icon-tree',
  });
  const dictSelectRule = useDictSelectRule();
  const apiSelectRule0 = useSelectRule({
    name: 'ApiSelect',
    label: '接口选择器',
    icon: 'icon-json',
    props: [...apiSelectRule],
    event: ['click', 'change', 'visibleChange', 'clear', 'blur', 'focus'],
  });

  /**
   * 构建系统字段菜单
   */
  const buildSystemMenu = () => {
    // 移除自带的下拉选择器组件，使用 currencySelectRule 替代
    // designer.value?.removeMenuItem('select')
    // designer.value?.removeMenuItem('radio')
    // designer.value?.removeMenuItem('checkbox')
    const components = [
      userSelectRule,
      deptSelectRule,
      dictSelectRule,
      apiSelectRule0,
    ];
    const menu: Menu = {
      name: 'system',
      title: '系统字段',
      list: components.map((component) => {
        // 插入组件规则
        designer.value?.addComponent(component);
        // 插入拖拽按钮到 `system` 分类下
        return {
          icon: component.icon,
          name: component.name,
          label: component.label,
        };
      }),
    };
    designer.value?.addMenu(menu);
  };

  onMounted(async () => {
    await nextTick();
    buildFormComponents();
    buildSystemMenu();
  });
};
