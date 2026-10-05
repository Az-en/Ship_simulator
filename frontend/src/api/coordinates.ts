import { getRequest } from "@/api/apiClient";
import { boundingBox, navigableWater, Port } from "@/types/coordinates";

export const getBB = (url: string = "/coordinates/boundingBox") =>
  getRequest<boundingBox>(url);

export const getNavigableWater = (
  url: string = "/coordinates/navigableWater",
) => getRequest<navigableWater>(url);

export const getPorts = (url: string = "/coordinates/ports") =>
  getRequest<Port[]>(url);
