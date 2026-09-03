/** 分页结果的最小结构，避免共享工具依赖具体请求实现。 */
export interface PageResultLike<T> {
  list: T[];
  total: number;
}

const DEFAULT_PAGE_SIZE = 200;

/** 自动翻页加载完整列表。 */
export async function getAllPageItems<T>(
  requestPage: (
    pageNo: number,
    pageSize: number,
  ) => Promise<PageResultLike<T>>,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const result: T[] = [];
  let pageNo = 1;
  let total: number;

  do {
    const page = await requestPage(pageNo, pageSize);
    result.push(...page.list);
    total = page.total;
    if (page.list.length === 0) {
      break;
    }
    pageNo++;
  } while (result.length < total);

  return result;
}
