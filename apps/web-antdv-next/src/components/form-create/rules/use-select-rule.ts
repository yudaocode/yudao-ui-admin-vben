import type { SelectRuleOption } from '#/components/form-create/typing';

import { buildUUID, cloneDeep } from '@vben/utils';

import {
  localeProps,
  makeRequiredRule,
} from '#/components/form-create/helpers';
import { selectRule } from '#/components/form-create/rules/data';

/**
 * 通用选择器规则 hook
 *
 * @param option 规则配置
 */
export function useSelectRule(option: SelectRuleOption) {
  const label = option.label;
  const name = option.name;
  const rules = cloneDeep(selectRule);
  return {
    icon: option.icon,
    label,
    name,
    event: option.event,
    rule() {
      // 构建基础规则
      const baseRule: any = {
        type: name,
        field: buildUUID(),
        title: label,
        info: '',
        $required: false,
      };
      // 将自定义 props 的默认值添加到 rule 的 props 中
      if (option.props && option.props.length > 0) {
        baseRule.props = {};
        option.props.forEach((prop: any) => {
          if (prop.field && prop.value !== undefined) {
            baseRule.props[prop.field] = prop.value;
          }
        });
      }
      return baseRule;
    },
    props(_: any, { t }: any) {
      if (!option.props) {
        option.props = [];
      }
      return localeProps(t, `${name}.props`, [
        makeRequiredRule(),
        ...option.props,
        ...rules,
      ]);
    },
  };
}
