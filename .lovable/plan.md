

# Otimizacao Desktop de Todas as Telas

## Diagnostico

O Dashboard ja foi otimizado para desktop (2 colunas, max-width, padding responsivo). As demais telas ainda usam layout mobile puro (`px-4` sem restricao de largura), ficando esticadas e desproporcionais em monitores.

## Telas Afetadas e Solucoes

### 1. Trilhos (`src/pages/Trails.tsx`)
- Adicionar `md:px-8 lg:max-w-4xl lg:mx-auto` ao container
- No modo **Mapa** (desktop): aumentar tamanhos dos icones de estacao e fontes
- No modo **Editar** (desktop): layout em 2 colunas para a lista de trilhos e habitos vinculados (`lg:grid lg:grid-cols-2 lg:gap-6`)
- Editor de horarios (Acordar/Dormir): layout horizontal mais espalhado com inputs maiores

### 2. Tarefas (`src/pages/Todos.tsx`)
- Container com `md:px-8 lg:max-w-2xl lg:mx-auto` (lista simples nao precisa ser muito larga)
- Input de nova tarefa e itens com padding e fonte maiores no desktop (`md:text-sm`, `md:py-5`)
- Botao de delete sempre visivel no desktop (sem depender de hover em touch)

### 3. Briefing (`src/pages/Briefing.tsx`)
- Aumentar `max-w-sm` para `max-w-md` no desktop via `md:max-w-md`
- Container principal com `md:px-8`
- Checklist items com fonte maior (`md:text-base`)
- Barra de progresso mais alta no desktop

### 4. Habitos (`src/pages/Habits.tsx`)
- Container com `md:px-8 lg:max-w-4xl lg:mx-auto`
- No desktop: cards em grid de 2 colunas (`lg:grid lg:grid-cols-2 lg:gap-4`) em vez de coluna unica
- Cards com padding maior (`md:p-5`) e fontes escaladas

### 5. Relatorio (`src/pages/Report.tsx`)
- Container com `md:px-8 lg:max-w-5xl lg:mx-auto`
- Stats grid: manter 4 colunas mas com cards maiores (`md:p-4`)
- Cards de habito com grid semanal mais espacado no desktop
- Graficos (charts) com altura maior no desktop

### 6. Analista (`src/pages/Analyst.tsx`)
- Container centralizado com `lg:max-w-3xl lg:mx-auto`
- Area de mensagens com bolhas maiores e fontes escaladas (`md:text-xs` para `md:text-sm`)
- Quick prompts em grid 2x2 no desktop (`md:grid-cols-2`)
- Input area com campo maior

### 7. Configuracoes (`src/pages/Settings.tsx`)
- Container com `md:px-8`
- Aumentar `max-w-sm` para `lg:max-w-lg`
- No desktop: cards em layout 2 colunas para perfil + stats lado a lado (`lg:grid lg:grid-cols-2 lg:gap-4`)

## Detalhes Tecnicos

Todas as mudancas sao puramente visuais via classes Tailwind responsivas (`md:`, `lg:`). Nenhuma logica de negocios e alterada.

Padroes consistentes em todas as telas:
- `md:px-8` para padding lateral em tablets
- `lg:max-w-Xxl lg:mx-auto` para centralizar e limitar largura em desktop
- `md:text-*` para escalar fontes
- `md:p-*` para padding de cards
- `lg:grid lg:grid-cols-*` para layouts multi-coluna onde faz sentido

