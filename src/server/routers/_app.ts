import { router } from "../trpc/init";
import { contactsRouter } from "./contacts";
import { campaignsRouter } from "./campaigns";
import { templatesRouter } from "./templates";
import { segmentsRouter } from "./segments";
import { sequencesRouter } from "./sequences";
import { smsRouter } from "./sms";
import { analyticsRouter } from "./analytics";
import { settingsRouter } from "./settings";

export const appRouter = router({
  contacts: contactsRouter,
  campaigns: campaignsRouter,
  templates: templatesRouter,
  segments: segmentsRouter,
  sequences: sequencesRouter,
  sms: smsRouter,
  analytics: analyticsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
