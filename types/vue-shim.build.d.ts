// Build-only ambient module for `tsc -p tsconfig.build.json`.
//
// TypeScript 7 cannot look inside SFCs, so during declaration emit a
// `.vue` import degrades to an opaque component. The public component
// types are hand-written contracts (`Draggable.ts`, `SortableList.ts`)
// and never rely on this shim.
//
// Tracked upstream: SFC declaration emit in Vize would remove this
// file entirely.
declare module "*.vue" {
  import type { Component } from "vue";

  const component: Component;
  export default component;
}
