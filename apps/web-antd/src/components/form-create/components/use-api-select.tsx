import type { ApiSelectProps } from '#/components/form-create/typing';

import { defineComponent, onMounted, ref, useAttrs } from 'vue';

import { useUserStore } from '@vben/stores';
import { isEmpty } from '@vben/utils';

import {
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Select,
  SelectOption,
} from 'ant-design-vue';

import { requestClient } from '#/api/request';

/**
 * 获得接口选择器的选项：请求配置的接口，并解析为 { label, value } 列表
 *
 * 流程打印也使用它，把接口选择器的值转换为选项名称
 *
 * @param props 接口选择器的配置，例如 url、method、data、parseFunc、labelField、valueField 等
 * @param query 远程搜索时输入的值
 */
export async function getApiSelectOptions(
  props: Record<string, any>,
  query?: any,
): Promise<any[]> {
  // 接口选择器
  if (isEmpty(props.url)) {
    return [];
  }

  switch (props.method) {
    case 'GET': {
      let url: string = props.url;
      if (props.remote && query !== undefined) {
        url = url.includes('?')
          ? `${url}&${props.remoteField}=${query}`
          : `${url}?${props.remoteField}=${query}`;
      }
      return parseOptions(props, await requestClient.get(url));
    }
    case 'POST': {
      const data: any = JSON.parse(props.data);
      if (props.remote) {
        data[props.remoteField] = query;
      }
      return parseOptions(props, await requestClient.post(props.url, data));
    }
  }
  return [];
}

function parseOptions(props: Record<string, any>, data: any) {
  //  情况一：如果有自定义解析函数优先使用自定义解析
  if (!isEmpty(props.parseFunc)) {
    return parseFunc(props)?.(data);
  }
  // 情况二：返回的直接是一个列表
  if (Array.isArray(data)) {
    return parseOptions0(props, data);
  }
  // 情况二：返回的是分页数据,尝试读取 list
  data = data.list;
  if (!!data && Array.isArray(data)) {
    return parseOptions0(props, data);
  }
  // 情况三：不是 yudao-vue-pro 标准返回
  console.warn(
    `接口[${props.url}] 返回结果不是 yudao-vue-pro 标准返回建议采用自定义解析函数处理`,
  );
  return [];
}

function parseOptions0(props: Record<string, any>, data: any[]) {
  return data.map((item: any) => {
    const label = parseExpression(item, props.labelField);
    let value = parseExpression(item, props.valueField);

    // 根据 returnType 决定返回值
    // 如果设置了 returnType 为 'name'，则返回 label 作为 value
    if (props.returnType === 'name') {
      value = label;
    }

    return {
      label,
      value,
    };
  });
}

function parseFunc(props: Record<string, any>) {
  let parse: any = null;
  if (props.parseFunc) {
    // 解析字符串函数
    // oxlint-disable-next-line typescript/no-implied-eval
    // oxlint-disable-next-line no-new-func, typescript/no-implied-eval
    parse = new Function(`return ${props.parseFunc}`)();
  }
  return parse;
}

function parseExpression(data: any, template: string) {
  // 检测是否使用了表达式
  if (!template.includes('${')) {
    return data[template];
  }
  // 正则表达式匹配模板字符串中的 ${...}
  const pattern = /\$\{([^}]*)\}/g;
  // 使用replace函数配合正则表达式和回调函数来进行替换
  return template.replaceAll(pattern, (_, expr) => {
    // expr 是匹配到的 ${} 内的表达式（这里是属性名），从 data 中获取对应的值
    const result = data[expr.trim()]; // 去除前后空白，以防用户输入带空格的属性名
    if (!result) {
      console.warn(
        `接口选择器选项模版[${template}][${expr.trim()}] 解析值失败结果为[${result}], 请检查属性名称是否存在于接口返回值中,存在则忽略此条！！！`,
      );
    }
    return result;
  });
}

export function useApiSelect(option: ApiSelectProps) {
  return defineComponent({
    name: option.name,
    props: {
      // 选项标签
      labelField: {
        type: String,
        default: () => option.labelField ?? 'label',
      },
      // 选项的值
      valueField: {
        type: String,
        default: () => option.valueField ?? 'value',
      },
      // api 接口
      url: {
        type: String,
        default: () => option.url ?? '',
      },
      // 请求类型
      method: {
        type: String,
        default: 'GET',
      },
      // 选项解析函数
      parseFunc: {
        type: String,
        default: '',
      },
      // 请求参数
      data: {
        type: String,
        default: '',
      },
      // 选择器类型，下拉框 select、多选框 checkbox、单选框 radio
      selectType: {
        type: String,
        default: 'select',
      },
      // 是否多选
      multiple: {
        type: Boolean,
        default: false,
      },
      // 是否远程搜索
      remote: {
        type: Boolean,
        default: false,
      },
      // 远程搜索时携带的参数
      remoteField: {
        type: String,
        default: 'label',
      },
      // 返回值类型（用于部门选择器等）：id 返回 ID，name 返回名称
      returnType: {
        type: String,
        default: 'id',
      },
      // 是否默认选中当前用户（仅用于 UserSelect）
      defaultCurrentUser: {
        type: Boolean,
        default: false,
      },
    },
    setup(props, { emit }) {
      const attrs = useAttrs();
      const options = ref<any[]>([]); // 下拉数据
      const loading = ref(false); // 是否正在从远程获取数据
      const queryParam = ref(); // 当前输入的值

      // 检查是否有有效的预设值
      function hasValidPresetValue(): boolean {
        const value = attrs.modelValue;
        if (value === undefined || value === null || value === '') {
          return false;
        }
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return true;
      }

      // 设置默认当前用户
      function setDefaultCurrentUser(): void {
        if (option.name !== 'UserSelect' || !props.defaultCurrentUser) {
          return;
        }
        if (hasValidPresetValue()) {
          return;
        }
        const userStore = useUserStore();
        const currentUserId = userStore.userInfo?.id;
        if (currentUserId) {
          const defaultValue = props.multiple ? [currentUserId] : currentUserId;
          emit('update:modelValue', defaultValue);
        }
      }

      const getOptions = async () => {
        options.value = [];
        options.value = await getApiSelectOptions(props, queryParam.value);
      };

      const remoteMethod = async (query: any) => {
        if (!query) {
          return;
        }
        loading.value = true;
        try {
          queryParam.value = query;
          await getOptions();
        } finally {
          loading.value = false;
        }
      };

      onMounted(async () => {
        await getOptions();
        // 设置默认当前用户（仅用于 UserSelect）
        setDefaultCurrentUser();
      });

      const buildSelect = () => {
        const {
          modelValue,
          'onUpdate:modelValue': onUpdateModelValue,
          ...restAttrs
        } = attrs;

        if (props.multiple) {
          // fix：多写此步是为了解决 multiple 属性问题
          return (
            <Select
              class="w-full"
              loading={loading.value}
              mode="multiple"
              onUpdate:value={onUpdateModelValue as any}
              value={modelValue as any}
              {...restAttrs}
              // TODO @xingyu remote 对等实现, 还是说没作用
              // remote={props.remote}
              {...(props.remote && { remoteMethod })}
            >
              {options.value.map(
                (item: { label: any; value: any }, index: any) => (
                  <SelectOption key={index} value={item.value}>
                    {item.label}
                  </SelectOption>
                ),
              )}
            </Select>
          );
        }
        return (
          <Select
            class="w-full"
            loading={loading.value}
            onUpdate:value={onUpdateModelValue as any}
            value={modelValue as any}
            {...restAttrs}
            // TODO: @xingyu remote 对等实现, 还是说没作用
            // remote={props.remote}
            {...(props.remote && { remoteMethod })}
          >
            {options.value.map(
              (item: { label: any; value: any }, index: any) => (
                <SelectOption key={index} value={item.value}>
                  {item.label}
                </SelectOption>
              ),
            )}
          </Select>
        );
      };
      const buildCheckbox = () => {
        const {
          modelValue,
          'onUpdate:modelValue': onUpdateModelValue,
          ...restAttrs
        } = attrs;
        if (isEmpty(options.value)) {
          options.value = [
            { label: '选项1', value: '选项1' },
            { label: '选项2', value: '选项2' },
          ];
        }
        return (
          <CheckboxGroup
            class="w-full"
            onUpdate:value={onUpdateModelValue as any}
            value={modelValue as any}
            {...restAttrs}
          >
            {options.value.map(
              (item: { label: any; value: any }, index: any) => (
                <Checkbox key={index} value={item.value}>
                  {item.label}
                </Checkbox>
              ),
            )}
          </CheckboxGroup>
        );
      };
      const buildRadio = () => {
        const {
          modelValue,
          'onUpdate:modelValue': onUpdateModelValue,
          ...restAttrs
        } = attrs;
        if (isEmpty(options.value)) {
          options.value = [
            { label: '选项1', value: '选项1' },
            { label: '选项2', value: '选项2' },
          ];
        }
        return (
          <RadioGroup
            class="w-full"
            onUpdate:value={onUpdateModelValue as any}
            value={modelValue}
            {...restAttrs}
          >
            {options.value.map(
              (item: { label: any; value: any }, index: any) => (
                <Radio key={index} value={item.value}>
                  {item.label}
                </Radio>
              ),
            )}
          </RadioGroup>
        );
      };
      return () => (
        <>
          {(() => {
            switch (props.selectType) {
              case 'checkbox': {
                return buildCheckbox();
              }
              case 'radio': {
                return buildRadio();
              }
              case 'select': {
                return buildSelect();
              }
              default: {
                return buildSelect();
              }
            }
          })()}
        </>
      );
    },
  });
}
