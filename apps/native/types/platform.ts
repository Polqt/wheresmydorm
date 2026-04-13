import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@wheresmydorm/api/routers/index";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type NotificationListItem = RouterOutputs["notifications"]["list"]["items"][number];
export type PaymentListItem = RouterOutputs["payments"]["list"]["items"][number];
export type PaymentCreateIntentInput = RouterInputs["payments"]["createIntent"];
export type PaymentCreateIntentResult = RouterOutputs["payments"]["createIntent"];
export type MessageThreadListItem = RouterOutputs["messages"]["getThreads"][number];
export type AdminConversationReportItem =
  RouterOutputs["admin"]["listConversationReports"][number];
export type AdminPostReportItem = RouterOutputs["admin"]["listPostReports"][number];
