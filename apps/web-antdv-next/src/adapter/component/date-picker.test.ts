import type { App } from 'vue';

import { createApp, defineComponent, h, nextTick } from 'vue';

import dayjs from 'dayjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DatePicker, RangePicker } from './date-picker';

const captured = vi.hoisted(() => ({ attrs: {} as Record<string, any> }));

vi.mock('antdv-next/dist/date-picker/index', async () => {
  const { defineComponent } = await import('vue');
  const picker = defineComponent({
    inheritAttrs: false,
    setup(_, { attrs }) {
      captured.attrs = attrs;
      return () => null;
    },
  });
  return { __esModule: true, default: picker, DateRangePicker: picker };
});

let app: App | undefined;

afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.innerHTML = '';
});

async function mountPicker(attrs: Record<string, any>, range = false) {
  captured.attrs = {};
  const host = document.createElement('div');
  document.body.append(host);
  app = createApp(
    defineComponent({
      render: () => h(range ? RangePicker : DatePicker, attrs),
    }),
  );
  app.mount(host);
  await vi.waitFor(() => expect(captured.attrs).toHaveProperty('value'));
  await nextTick();
  return captured.attrs;
}

describe('next date picker adapter', () => {
  const date = new Date('2026-10-03T01:02:03.456Z');

  it.each(['value', 'defaultValue', 'pickerValue', 'defaultPickerValue'])(
    'normalizes Date in %s with seconds format',
    async (key) => {
      const attrs = await mountPicker({
        value: date,
        [key]: date,
        valueFormat: 'X',
      });
      expect(attrs[key]).toBe('1790989323');
    },
  );

  it('keeps milliseconds and numeric zero', async () => {
    const attrs = await mountPicker(
      { value: [date, 0], 'value-format': 'x' },
      true,
    );
    expect(attrs.value).toEqual(['1790989323456', '0']);
    expect(attrs.valueFormat).toBe('x');
  });

  it('formats Dates and preserves empty range ends', async () => {
    const attrs = await mountPicker(
      { value: [date, null], valueFormat: 'YYYY-MM-DD' },
      true,
    );
    expect(attrs.value).toEqual([dayjs(date).format('YYYY-MM-DD'), null]);
  });

  it('provides dayjs when no value format is configured', async () => {
    const attrs = await mountPicker({ value: date });
    expect(dayjs.isDayjs(attrs.value)).toBe(true);
    expect(attrs.value.valueOf()).toBe(date.getTime());
  });
});
