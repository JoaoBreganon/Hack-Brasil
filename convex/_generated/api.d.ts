/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alertas from "../alertas.js";
import type * as contatos from "../contatos.js";
import type * as crons from "../crons.js";
import type * as escolas from "../escolas.js";
import type * as itens from "../itens.js";
import type * as lib_falha from "../lib/falha.js";
import type * as lib_firecrawl from "../lib/firecrawl.js";
import type * as lib_nvoip from "../lib/nvoip.js";
import type * as lib_plano from "../lib/plano.js";
import type * as lib_requisicao from "../lib/requisicao.js";
import type * as orcamentos from "../orcamentos.js";
import type * as painel from "../painel.js";
import type * as pddeInfo from "../pddeInfo.js";
import type * as planos from "../planos.js";
import type * as precos from "../precos.js";
import type * as saldos from "../saldos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alertas: typeof alertas;
  contatos: typeof contatos;
  crons: typeof crons;
  escolas: typeof escolas;
  itens: typeof itens;
  "lib/falha": typeof lib_falha;
  "lib/firecrawl": typeof lib_firecrawl;
  "lib/nvoip": typeof lib_nvoip;
  "lib/plano": typeof lib_plano;
  "lib/requisicao": typeof lib_requisicao;
  orcamentos: typeof orcamentos;
  painel: typeof painel;
  pddeInfo: typeof pddeInfo;
  planos: typeof planos;
  precos: typeof precos;
  saldos: typeof saldos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
