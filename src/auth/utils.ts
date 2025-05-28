export function extractDbid(params: any): string | undefined {
  return (
    params.dbid ||
    params.tableId ||
    params.appId ||
    params.body?.from ||
    params.body?.to
  );
}
