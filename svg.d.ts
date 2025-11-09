declare module "*.svg" {
  const content: import("next/dist/shared/lib/get-img-props").StaticImport;
  export default content;
}
