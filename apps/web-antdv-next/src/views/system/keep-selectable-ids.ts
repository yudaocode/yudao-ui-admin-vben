/** 下拉/树只含启用项时，用来判断已保存的 id 还能不能提交。 */
export function selectableIdSet(
  rows: ReadonlyArray<{ id?: null | number | string }>,
): Set<number> {
  return new Set(
    rows.flatMap((row) =>
      row.id == null || row.id === '' ? [] : [Number(row.id)],
    ),
  );
}

export function pruneSelectableIds<T>(
  selected: readonly T[] | undefined,
  validIds: ReadonlySet<number>,
): { changed: boolean; kept: T[] } {
  const list = selected ?? [];
  const kept = list.filter((id) => validIds.has(Number(id)));
  return { changed: kept.length !== list.length, kept };
}

export function isSelectableId(
  id: unknown,
  validIds: ReadonlySet<number>,
): boolean {
  return id != null && id !== '' && validIds.has(Number(id));
}
