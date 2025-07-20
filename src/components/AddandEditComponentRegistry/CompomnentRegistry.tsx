// src/screens/AddEdit/componentRegistry.ts

import AddEditProperty from "@/src/components/AddandEditComponents/AddandEditProperty";

export const componentRegistry = {
  property: AddEditProperty,
  //   tenant: AddEditTenant,
  //   room: AddEditRoom,
  //   // ➕ Add more in the future here
};

export type ComponentKey = keyof typeof componentRegistry;
export interface AddEditComponentProps {
  type: "add" | "edit";
  propertyData?: any; // You can specialize this with a generic if needed
}
