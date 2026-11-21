# AGENTS.md

- Monorepo pnpm: `apps/web` (Next.js), `convex/` (funções e banco) e `packages/dominio` (regras puras do PDDE, com Vitest).
- Verificação: `pnpm test`, `pnpm typecheck` e `pnpm lint`. Formatação: `npx prettier --check <arquivos>`.
- Código sem comentários (`//` ou `/* */`), indentado com tab, com identificadores e textos em português.
- Ao criar ou remover módulos em `convex/`, regenere `convex/_generated` com `npx convex codegen --typecheck disable` (não publica as funções) e rode `pnpm convex:limpar`.
- Os testes do Convex usam convex-test em `convex/fluxo.test.ts`. Chamadas externas são simuladas com `vi.stubGlobal("fetch", ...)` e chaves com `vi.stubEnv`.
- O Git usa `core.autocrlf=true`: rodar o Prettier num arquivo sem mudanças troca CRLF por LF e o deixa marcado como modificado, sem diferença de conteúdo.
