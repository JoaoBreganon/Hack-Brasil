const DELIMITADORES = [";", "\t", ","] as const;

export type Delimitador = (typeof DELIMITADORES)[number];

export type LinhaDoCsv = {
	numero: number;
	campos: string[];
};

function contarFora(texto: string, caractere: string): number {
	let total = 0;
	let entreAspas = false;
	for (const atual of texto) {
		if (atual === '"') {
			entreAspas = !entreAspas;
		} else if (atual === caractere && !entreAspas) {
			total += 1;
		}
	}
	return total;
}

export function detectarDelimitador(cabecalho: string): Delimitador {
	return DELIMITADORES.reduce((melhor, candidato) =>
		contarFora(cabecalho, candidato) > contarFora(cabecalho, melhor) ? candidato : melhor,
	);
}

export function lerCsv(texto: string): LinhaDoCsv[] {
	const conteudo = texto.replace(/^\uFEFF/, "");
	const delimitador = detectarDelimitador(conteudo.split(/\r?\n/, 1)[0]);
	const linhas: LinhaDoCsv[] = [];
	let campos: string[] = [];
	let campo = "";
	let entreAspas = false;
	let numeroAtual = 1;
	let inicioDaLinha = 1;

	const fecharLinha = () => {
		campos.push(campo);
		if (campos.some((valor) => valor.trim() !== "")) {
			linhas.push({ numero: inicioDaLinha, campos });
		}
		campos = [];
		campo = "";
		inicioDaLinha = numeroAtual;
	};

	for (let indice = 0; indice < conteudo.length; indice += 1) {
		const caractere = conteudo[indice];
		if (caractere === "\r" && conteudo[indice + 1] === "\n") {
			continue;
		}
		const quebra = caractere === "\n" || caractere === "\r";
		if (entreAspas) {
			if (caractere === '"' && conteudo[indice + 1] === '"') {
				campo += '"';
				indice += 1;
			} else if (caractere === '"') {
				entreAspas = false;
			} else {
				campo += quebra ? "\n" : caractere;
			}
		} else if (caractere === '"') {
			entreAspas = true;
		} else if (caractere === delimitador) {
			campos.push(campo);
			campo = "";
		} else if (!quebra) {
			campo += caractere;
		}
		if (quebra) {
			numeroAtual += 1;
			if (!entreAspas) {
				fecharLinha();
			}
		}
	}
	fecharLinha();
	return linhas;
}
