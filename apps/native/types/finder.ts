import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@wheresmydorm/api/routers/index";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type FinderFindNearbyInput = RouterInputs["listings"]["findNearby"];
export type FinderQuotaStatus = RouterOutputs["listings"]["findQuotaStatus"];

export type FinderSearchCenter = {
  label: string;
  latitude: number;
  longitude: number;
};
