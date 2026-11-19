import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const ALERTAS = cronJobs();

ALERTAS.daily("alertas de prazo do PDDE", { hourUTC: 12, minuteUTC: 0 }, internal.alertas.enviarDoDia, {});

export default ALERTAS;
