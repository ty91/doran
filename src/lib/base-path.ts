export const basePath = "/doran";

export function withBasePath(path: string): string {
  return `${basePath}${path}`;
}
