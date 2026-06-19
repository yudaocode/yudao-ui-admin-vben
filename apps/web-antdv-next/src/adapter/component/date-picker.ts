import type { Component } from 'vue';

import type { Recordable } from '@vben/types';

import { defineAsyncComponent, defineComponent, h, ref } from 'vue';

const RawDatePicker = defineAsyncComponent(
  () => import('antdv-next/dist/date-picker/index'),
);
const RawRangePicker = defineAsyncComponent(() =>
  import('antdv-next/dist/date-picker/index').then(
    (res) => res.DateRangePicker,
  ),
);

const TIMESTAMP_VALUE_FORMATS = new Set(['x', 'X']);

function isTimestampValueFormat(valueFormat: unknown) {
  return (
    typeof valueFormat === 'string' && TIMESTAMP_VALUE_FORMATS.has(valueFormat)
  );
}

function normalizeTimestampPickerValue(value: any, valueFormat: unknown): any {
  if (!isTimestampValueFormat(valueFormat)) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeTimestampPickerValue(item, valueFormat));
  }
  return typeof value === 'number' ? String(value) : value;
}

function withTimestampValueFormat(
  component: Component,
  name: 'DatePicker' | 'RangePicker',
) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, expose, slots }) {
      const innerRef = ref();
      expose(
        new Proxy(
          {},
          {
            get: (_target, key) => innerRef.value?.[key],
            has: (_target, key) => key in (innerRef.value || {}),
          },
        ),
      );

      return () => {
        const pickerAttrs: Recordable<any> = { ...attrs };
        if (
          'value-format' in pickerAttrs &&
          !Reflect.has(pickerAttrs, 'valueFormat')
        ) {
          pickerAttrs.valueFormat = pickerAttrs['value-format'];
        }
        const valueFormat = pickerAttrs.valueFormat;

        for (const key of [
          'value',
          'defaultValue',
          'pickerValue',
          'defaultPickerValue',
        ]) {
          if (Reflect.has(pickerAttrs, key)) {
            pickerAttrs[key] = normalizeTimestampPickerValue(
              pickerAttrs[key],
              valueFormat,
            );
          }
        }

        return h(component, { ...pickerAttrs, ref: innerRef }, slots);
      };
    },
  });
}

const DatePicker = withTimestampValueFormat(RawDatePicker, 'DatePicker');
const RangePicker = withTimestampValueFormat(RawRangePicker, 'RangePicker');

export { DatePicker, RangePicker };
