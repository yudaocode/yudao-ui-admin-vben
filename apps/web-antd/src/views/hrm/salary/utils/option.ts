import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

/** 获得叶子薪资项 */
export function getSalaryLeafOptions(
  options?: HrmSalaryOptionApi.SalaryOption[],
) {
  const result: HrmSalaryOptionApi.SalaryOption[] = [];
  function append(optionsToAppend?: HrmSalaryOptionApi.SalaryOption[]) {
    for (const option of optionsToAppend || []) {
      if (option.children?.length) {
        append(option.children);
      } else {
        result.push(option);
      }
    }
  }
  append(options);
  return result;
}

/** 获得员工指定薪资项金额 */
export function getSalaryOptionValue(
  employeeRecord: HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord,
  optionCode: number,
) {
  return employeeRecord.optionValues?.find(
    (option) => option.code === optionCode,
  )?.value;
}

/** 获得员工指定薪资项金额（数值） */
export function getSalaryOptionNumberValue(
  employeeRecord: HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord,
  optionCode: number,
) {
  return Number(
    employeeRecord.optionValues?.find((option) => option.code === optionCode)
      ?.value || 0,
  );
}

/** 更新员工指定薪资项金额 */
export function updateSalaryOptionValue(
  employeeRecord: HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord,
  optionCode: number,
  value: null | number | undefined,
) {
  const optionValue = employeeRecord.optionValues?.find(
    (option) => option.code === optionCode,
  );
  if (optionValue) {
    optionValue.value = Number(value || 0);
    return;
  }
  employeeRecord.optionValues = [
    ...(employeeRecord.optionValues || []),
    { code: optionCode, value: Number(value || 0) },
  ];
}
