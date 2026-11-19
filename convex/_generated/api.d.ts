import type * as escolas from "../escolas.js";
import type * as pddeInfo from "../pddeInfo.js";
import type * as saldos from "../saldos.js";
import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
declare const fullApi: ApiFromModules<{
	escolas: typeof escolas;
	pddeInfo: typeof pddeInfo;
	saldos: typeof saldos;
}>;
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
export declare const components: {};
