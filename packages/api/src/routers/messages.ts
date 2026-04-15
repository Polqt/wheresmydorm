import { router } from "../index";
import { messageActionProcedures } from "./messages.actions";
import { messageThreadProcedures } from "./messages.threads";

export const messagesRouter = router({
  ...messageThreadProcedures,
  ...messageActionProcedures,
});
