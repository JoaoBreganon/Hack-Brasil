import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const PASTA_GERADA = path.resolve(import.meta.dirname, "../convex/_generated");
const IMPRESSORA = ts.createPrinter({ removeComments: true });

for (const nome of readdirSync(PASTA_GERADA)) {
	const caminho = path.join(PASTA_GERADA, nome);
	const tipo = nome.endsWith(".js") ? ts.ScriptKind.JS : ts.ScriptKind.TS;
	const fonte = ts.createSourceFile(nome, readFileSync(caminho, "utf8"), ts.ScriptTarget.Latest, false, tipo);
	writeFileSync(caminho, IMPRESSORA.printFile(fonte));
}
