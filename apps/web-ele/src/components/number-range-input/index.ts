import type { VbenFormSchema } from '#/adapter/form';

import { markRaw } from 'vue';

import NumberRangeInput from './number-range-input.vue';

export { default as NumberRangeInput } from './number-range-input.vue';

export type NumberRangeValue = [number | undefined, number | undefined];

function splitNumberRange(minFieldName: string, maxFieldName: string) {
  return (
    value: NumberRangeValue | undefined,
    setValue: (fieldName: string, value: number | undefined) => void,
  ) => {
    setValue(minFieldName, value?.[0]);
    setValue(maxFieldName, value?.[1]);
    return undefined;
  };
}

export function buildNumberRangeSchema(
  label: string,
  fieldName: string,
  minFieldName: string,
  maxFieldName: string,
  precision: number,
): VbenFormSchema {
  return {
    component: markRaw(NumberRangeInput),
    componentProps: {
      min: 0,
      precision,
    },
    fieldName,
    label,
    valueFormat: splitNumberRange(minFieldName, maxFieldName),
  };
}
