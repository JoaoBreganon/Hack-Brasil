import { criarData, ehDiaUtil, paraTextoIso, somarDias } from "./calendario";

const DIAS_DA_SEMANA = 7;
const NOME_DO_MES = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

export type TipoDoDia = "passado" | "hoje" | "util" | "livre" | "ultimo" | "estorno";

export type DiaDoCalendario = {
	dia: number;
	iso: string;
	tipo: TipoDoDia;
};

export type MesDoCalendario = {
	chave: string;
	nome: string;
	semanas: (DiaDoCalendario | null)[][];
};

export type DatasDoPrazo = {
	hoje: Date;
	limiteParaUso: Date;
	estorno: Date;
};

function tipoDoDia(data: Date, { hoje, limiteParaUso, estorno }: DatasDoPrazo): TipoDoDia {
	const tempo = data.getTime();
	if (tempo === limiteParaUso.getTime()) {
		return "ultimo";
	}
	if (tempo === estorno.getTime()) {
		return "estorno";
	}
	if (tempo === hoje.getTime()) {
		return "hoje";
	}
	if (tempo < hoje.getTime()) {
		return "passado";
	}
	return tempo < limiteParaUso.getTime() && ehDiaUtil(data) ? "util" : "livre";
}

function nomeDoMes(data: Date): string {
	const nome = NOME_DO_MES.format(data);
	return nome.charAt(0).toUpperCase() + nome.slice(1);
}

function montarMes(ano: number, mes: number, datas: DatasDoPrazo): MesDoCalendario {
	const primeiro = criarData(ano, mes, 1);
	const dias: (DiaDoCalendario | null)[] = Array.from({ length: primeiro.getUTCDay() }, () => null);
	for (let data = primeiro; data.getUTCMonth() === mes - 1; data = somarDias(data, 1)) {
		dias.push({ dia: data.getUTCDate(), iso: paraTextoIso(data), tipo: tipoDoDia(data, datas) });
	}
	while (dias.length % DIAS_DA_SEMANA !== 0) {
		dias.push(null);
	}
	const semanas = Array.from({ length: dias.length / DIAS_DA_SEMANA }, (_, indice) =>
		dias.slice(indice * DIAS_DA_SEMANA, (indice + 1) * DIAS_DA_SEMANA),
	);
	return { chave: `${ano}-${mes}`, nome: nomeDoMes(primeiro), semanas };
}

export function montarMesesDoPrazo(datas: DatasDoPrazo): MesDoCalendario[] {
	const meses: MesDoCalendario[] = [];
	let ano = datas.hoje.getUTCFullYear();
	let mes = datas.hoje.getUTCMonth() + 1;
	const ultimo = datas.estorno.getUTCFullYear() * 12 + datas.estorno.getUTCMonth();
	while (ano * 12 + mes - 1 <= ultimo) {
		meses.push(montarMes(ano, mes, datas));
		mes = mes === 12 ? 1 : mes + 1;
		ano = mes === 1 ? ano + 1 : ano;
	}
	return meses;
}
