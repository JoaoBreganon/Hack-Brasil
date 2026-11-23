# AGENTS.md

- Monorepo pnpm: `apps/web` (Next.js), `convex/` (funções e banco) e `packages/dominio` (regras puras do PDDE, com Vitest).
- Verificação: `pnpm test`, `pnpm typecheck`, `pnpm lint` e `pnpm build`. Formatação: `npx prettier --check <arquivos>`.
- Código sem comentários (`//` ou `/* */`), indentado com tab, com identificadores e textos em português.
- Ao criar ou remover módulos em `convex/`, regenere `convex/_generated` com `npx convex codegen --typecheck disable` (não publica as funções) e rode `pnpm convex:limpar`.
- Os testes do Convex usam convex-test em `convex/fluxo.test.ts`. Chamadas externas são simuladas com `vi.stubGlobal("fetch", ...)` e chaves com `vi.stubEnv`.
- O Git usa `core.autocrlf=true`: rodar o Prettier num arquivo sem mudanças troca CRLF por LF e o deixa marcado como modificado, sem diferença de conteúdo.
- Testes de ponta a ponta: `pnpm test:e2e` (Playwright, em `e2e/`). Precisam do Chromium (`pnpm exec playwright install chromium`) e de `NEXT_PUBLIC_CONVEX_URL` apontando para um Convex com as funções atuais. Cada execução cria uma escola fictícia com INEP 99xxxxxx e carrega o saldo pela planilha CSV.
- Para um Convex local isolado, sem mexer no `.env.local` da raiz nem no deployment da nuvem: copie `package.json` e `convex/` (sem os `*.test.ts`) para uma pasta temporária dentro do repositório e rode nela `node ../node_modules/convex/bin/main.js dev --typecheck disable --codegen disable` com `CONVEX_AGENT_MODE=anonymous`. Ele sobe em http://127.0.0.1:3210; rode `pnpm test:e2e` com `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210` e apague a pasta no fim.
- Sem `pnpm` no PATH, use `corepack pnpm <comando>`. Os scripts que chamam `pnpm` por dentro (`dev`, `build`, `lint`, `typecheck`) falham assim; rode `node node_modules/next/dist/bin/next dev` em `apps/web` ou ative com `corepack enable`.
- O `next.config.ts` relê o `.env.local` da raiz com `loadEnvConfig(..., true)`. Sem o `forceReload`, o cache do `@next/env` ignora a raiz, `NEXT_PUBLIC_CONVEX_URL` some no servidor e as telas da escola mostram o aviso de banco desligado.
- Nomes de rotinas em `convex/crons.ts` só aceitam ASCII (sem acento).
- A escola de demonstração (`ehEscolaDeDemonstracao`, INEP 35079923) não cadastra celular nem envia alertas, e `demonstracao.restaurar` apaga o plano dela depois de uma hora sem mudanças. Nos testes do Convex, use `INEP_COMUM` para contatos e alertas.
- `useOperacao` devolve `undefined` quando a operação falha. Mutation sem retorno chega ao cliente como `null`, então confira o sucesso com `!== undefined`.
