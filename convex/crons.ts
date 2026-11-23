import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const ROTINAS = cronJobs();

ROTINAS.daily("alertas de prazo do PDDE", { hourUTC: 12, minuteUTC: 0 }, internal.alertas.enviarDoDia, {});
ROTINAS.hourly("restaurar a escola de demonstracao", { minuteUTC: 0 }, internal.demonstracao.restaurar, {});

export default ROTINAS;
