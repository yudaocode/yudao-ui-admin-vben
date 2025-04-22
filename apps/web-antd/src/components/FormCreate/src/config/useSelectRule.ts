import type { SelectRuleOption } from '#/components/FormCreate/src/type';

import { buildUUID } from '@vben/utils';

import cloneDeep from 'lodash.clonedeep';

import { selectRule } from '#/components/FormCreate/src/config/selectRule';
import {
  localeProps,
  makeRequiredRule,
} from '#/components/FormCreate/src/utils';

/**
 * 通用选择器规则 hook
 *
 * @param option 规则配置
 */
export const useSelectRule = (option: SelectRuleOption) => {
  const label = option.label;
  const name = option.name;
  const rules = cloneDeep(selectRule);
  return {
    icon: option.icon,
    label,
    name,
    event: option.event,
    rule() {
      return {
        type: name,
        field: buildUUID(),
        title: label,
        info: '',
        $required: false,
      };
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
};
