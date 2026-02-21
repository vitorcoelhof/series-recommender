# Design: Series Recommender

**Data:** 2026-02-21
**Status:** Aprovado

---

## Visão Geral

Web app que ajuda usuários a descobrir novos seriados com base nos que já assistiram e mais gostaram. O usuário inputa sua lista de séries assistidas, o sistema enriquece com dados do OMDb (nota IMDB, gêneros, poster), o usuário seleciona seus top 10, e a Claude API gera uma recomendação personalizada com justificativa.

---

## Arquitetura

**Stack:** Next.js 15 (App Router) + Tailwind CSS + TypeScript
**Deploy:** Vercel
**APIs externas:** OMDb API (dados de séries) + Anthropic Claude API (recomendação)
**Estado:** Client-side apenas (React state) — sem banco de dados, sem autenticação

### Rotas

| Rota | Comportamento |
|------|--------------|
| `/` | Usuário cola ou faz upload do `.md` com sua lista |
| `/vitor` | Lista do `series.md` pré-carregada automaticamente |

### Server Actions

| Action | Responsabilidade |
|--------|-----------------|
| `enrichSeries` | Busca dados OMDb para cada série da lista (paralelo via `Promise.allSettled`) |
| `getRecommendation` | Envia top 10 + lista completa para Claude e retorna `{ title, reason }` |

---

## Fluxo em 4 Etapas

```
[1. Lista]  →  [2. Enriquecimento]  →  [3. Top 10]  →  [4. Recomendação]
  Input          OMDb + gêneros        Seleção user      Claude API
```

Todo o estado é mantido em memória no cliente entre as etapas.

---

## Componentes e UX

### Etapa 1 — Input da lista

- **`/`**: Textarea onde o usuário cola a lista (uma série por linha) ou faz upload de arquivo `.md`
- **`/vitor`**: Mesmo componente, pré-populado com `series.md` — usuário vê a lista e clica "Continuar"
- Parser: remove prefixo numérico (`1→`, `1.`), retorna array de strings com nomes limpos

### Etapa 2 — Enriquecimento (OMDb)

- Botão "Buscar dados" dispara Server Action
- Chamadas em paralelo com `Promise.allSettled`
- Loading com progresso: `Buscando 1 de 42...`
- Séries não encontradas ficam marcadas com aviso mas não bloqueiam o fluxo

### Etapa 3 — Seleção do Top 10

- Grid de cards com poster, nota IMDB e gêneros
- Clique no card seleciona/deseleciona (máx. 10)
- Contador visível: `7/10 selecionados`
- Botão "Ver minha recomendação" habilitado somente com exatamente 10 selecionados

### Etapa 4 — Recomendação (Claude)

- Loading enquanto Claude processa
- Resultado: nome da série, poster (OMDb), nota IMDB, gêneros, justificativa personalizada
- Botão "Gerar outra recomendação" para receber uma sugestão diferente

---

## Integrações

### Parser do `.md`

```
Entrada:  "1→Breaking Bad"
Saída:    "Breaking Bad"

Regex:    /^\d+[→.]\s*/
```

### OMDb API

```
GET https://www.omdbapi.com/?t={nome}&type=series&apikey={OMDB_API_KEY}

Campos extraídos: Title, imdbRating, Genre, Poster, Year, imdbID
Limite: 1.000 req/dia (tier gratuito)
```

### Claude API — Prompt

```
Você é um especialista em séries de TV.

O usuário já assistiu estas séries: [lista completa].

Os 10 favoritos do usuário são:
[top 10 com título, gêneros e nota IMDB]

Recomende UMA série que o usuário ainda não assistiu.
A série NÃO pode estar na lista de séries já assistidas.
Justifique em 2-3 frases baseando-se nos padrões do top 10.

Responda apenas em JSON válido:
{"title": "Nome da Série", "reason": "Justificativa..."}
```

---

## Variáveis de Ambiente

```env
OMDB_API_KEY=...
ANTHROPIC_API_KEY=...
```

---

## Estrutura de Arquivos (prevista)

```
series-recommender/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Etapa 1: input da lista (rota /)
│   │   ├── vitor/
│   │   │   └── page.tsx           # Lista pré-carregada do Vitor
│   │   └── actions/
│   │       ├── enrichSeries.ts    # Server Action: OMDb
│   │       └── getRecommendation.ts # Server Action: Claude
│   ├── components/
│   │   ├── StepIndicator.tsx      # Indicador de progresso (1→2→3→4)
│   │   ├── SeriesInput.tsx        # Textarea + upload
│   │   ├── EnrichmentLoader.tsx   # Loading com progresso
│   │   ├── SeriesCard.tsx         # Card com poster, nota, gêneros
│   │   ├── TopTenGrid.tsx         # Grid de seleção do top 10
│   │   └── RecommendationResult.tsx # Resultado final
│   ├── lib/
│   │   ├── parser.ts              # Parser do .md
│   │   ├── omdb.ts                # Cliente OMDb
│   │   └── claude.ts              # Cliente Claude
│   └── data/
│       └── vitor-series.ts        # Lista do Vitor (hardcoded do series.md)
├── docs/
│   └── plans/
│       └── 2026-02-21-series-recommender-design.md
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Decisões Técnicas

- **Stateless:** Sem banco de dados no MVP. Estado em React state no cliente entre etapas.
- **`Promise.allSettled`:** Garante que falhas individuais no OMDb não bloqueiam o enriquecimento da lista inteira.
- **Server Actions:** Mantém as API keys seguras no servidor (OMDB e Anthropic nunca expostas ao cliente).
- **`/vitor` hardcoded:** Lista do Vitor vive em `src/data/vitor-series.ts` — simples, sem leitura de arquivo em runtime.
- **Rota `/vitor` extensível:** O padrão pode virar `/[username]` no futuro com listas salvas em banco.
