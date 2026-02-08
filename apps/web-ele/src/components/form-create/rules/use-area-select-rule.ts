import { cloneDeep } from '@vben/utils';

import {
  localeProps,
  makeRequiredRule,
} from '#/components/form-create/helpers';

/** 省市区选择器规则 */
export function useAreaSelectRule() {
  const label = '省市区选择器';
  const name = 'AreaSelect';

  return {
    icon: 'icon-location',
    label,
    name,
    rule() {
      return {
        type: name,
        field: `area_${Date.now()}`,
        title: label,
        info: '',
        $required: false,
        modelField: 'model-value', // 特殊：ele 里是 model-value，antd 里是 value
      };
    },
    props(_: any, { t }: any) {
      return localeProps(t, `${name}.props`, [
        makeRequiredRule(),
        {
          type: 'select',
          field: 'level',
          title: '选择层级',
          value: 3,
          options: [
            { label: '省', value: 1 },
            { label: '省/市', value: 2 },
            { label: '省/市/区', value: 3 },
          ],
          info: '限制可选择的地区层级',
        },
        {
          type: 'input',
          field: 'placeholder',
          title: '占位符',
          value: '请选择省市区',
        },
        {
          type: 'switch',
          field: 'clearable',
          title: '是否可清空',
          value: true,
        },
        {
          type: 'switch',
          field: 'showAllLevels',
          title: '显示完整路径',
          value: true,
          info: '输入框中是否显示选中值的完整路径',
        },
        {
          type: 'input',
          field: 'separator',
          title: '分隔符',
          value: '/',
          info: '选项分隔符',
        },
        {
          type: 'switch',
          field: 'disabled',
          title: '是否禁用',
          value: false,
        },
      ]);
    },
  };
}
