# Shūchū: personas, teste, monetização e decisão de produção

Data: 22/11/2026. Base: build de desenvolvimento no Simulador iOS (iPhone 18 Pro Max, iOS 27.2), commit `e66cb80`.

> Como foi feito: as personas são hipóteses (não entrevistas reais). Para cada uma, percorri o app no Simulador do jeito que ela usaria (duração, pausa, intervalo, loja, heróis, estatísticas, fonte grande, idioma) e anotei o que agradaria e o que atrapalharia. O próximo passo para validar é colocar o app na mão de 5 a 10 pessoas reais de cada grupo via TestFlight.

## 1. Personas

| # | Persona | Perfil | O que ela quer do app |
|---|---|---|---|
| 1 | **Ana, 19, vestibulanda** | Estuda 4–6 h/dia, gosta de anime, orçamento curto | Ciclos 25/5, sequência diária, ver o progresso, celular apoiado na mesa |
| 2 | **Lucas, 29, dev remoto** | Trabalho profundo, odeia fricção | Blocos de 50–90 min, iniciar rápido, notificação confiável |
| 3 | **Mariana, 33, TDAH** | Começar é o mais difícil; culpa quando falha | Sessões curtas (5–10 min), recompensa imediata, não ser punida por um dia ruim |
| 4 | **Pedro, 16, otaku colecionador** | Joga gacha, quer completar coleções | Muitos heróis e itens, raridade, novidades frequentes |
| 5 | **Carla, 41, mãe e analista** | Interrompida o tempo todo | Pausar sem perder, sessões de 15 min, dias pulados sem drama |
| 6 | **Rafael, 24, concurseiro** | Mede tudo, metas semanais | Histórico, estatísticas, blocos longos, exportar dados |
| 7 | **Júlia, 27, designer freelancer** | Sensível à estética, paga por coisas bonitas | Visual caprichado, temas, personalização; pagaria por cosméticos |
| 8 | **Seu Roberto, 58, aprendendo inglês** | Usa fonte grande, prefere português | Telas legíveis, nada quebrando, tudo traduzido, acessível no VoiceOver |

## 2. O que cada persona encontrou no teste (antes dos ajustes)

| Persona | Gostou | Atrapalhou |
|---|---|---|
| Ana | Herói andando, arco de 4 episódios, sequência, Matsuri | Tela apagava durante a sessão (o charme do herói some); perder a sequência por 1 dia |
| Lucas | Notificação no fim, pausa, Stats | **Não havia 50/90 min** (máximo 60); tela inicial é longa até o botão |
| Mariana | Recompensa visual forte na tela de sucesso | **Mínimo de 15 min** (alto para quem tem TDAH); sequência zera com um dia ruim |
| Pedro | Heróis e itens com personalidade | **Conteúdo acaba rápido**: 934 onigiri desbloqueiam tudo; com 4×25 min/dia ganha ~110/dia, ou seja, tudo em ~9 dias |
| Carla | Pausa congela o tempo; reabrir volta à sessão | Dias pulados zeravam a sequência |
| Rafael | Gráfico de 7 dias, histórico | Calendário de 5 semanas vazio no iOS (já corrigido antes); sem exportação |
| Júlia | Estética mangá, provador da loja | Poucos cenários (4); sem temas |
| Seu Roberto | Português completo | Com fonte de acessibilidade: chip "60" quebrava em "6/0", "Hachima-ki" quebrava no meio, Ajustes cortado sem rolagem; nomes das abas no VoiceOver ficavam em inglês |

Exploit encontrado na economia: o bônus de sequência (+2 a +10) era pago **em toda sessão**. Com sessões curtas, quatro sessões de 5 min renderiam mais que uma de 60 min.

## 3. Ajustes feitos no app (commit `e66cb80`)

| Ajuste | Personas atendidas |
|---|---|
| Durações 5, 10, 15, 25, 45, 60, 90 min numa linha rolável | Lucas, Mariana, Rafael, Carla, Ana |
| **Manter a tela ligada** durante a sessão (Ajustes, ligado por padrão; desliga ao pausar) | Ana, Rafael, Carla, Júlia |
| **Dia de descanso**: 1 dia sem sessão não quebra a sequência (no máximo 1 a cada 7 dias ativos), explicado em Stats | Mariana, Carla, Ana |
| Bônus de sequência pago **uma vez por dia** (fecha o exploit das sessões curtas) | Economia (Pedro, monetização) |
| Fonte grande: chips numa linha, títulos e saldo com limite de escala, nomes da loja sem quebra no meio, Ajustes com rolagem | Seu Roberto |
| Nomes das abas no VoiceOver seguem o idioma | Seu Roberto |

Testado no Simulador em fonte normal e de acessibilidade; regra do dia de descanso coberta por casos de teste (sequência contínua, 1 dia pulado, 2 dias pulados, dois descansos na mesma semana, melhor sequência).

**Não verificável no Simulador:** a tela ligada (o Simulador não bloqueia sozinho). Conferir num iPhone real.

## 4. O que ficou de fora (backlog priorizado)

| Prioridade | Item | Por quê | Personas |
|---|---|---|---|
| **P0 antes de lançar** | **Fôlego de conteúdo e economia** | Com ~9 dias para desbloquear tudo, a retenção cai na 2ª semana. Opções: preços em curva (heróis 100–600), raridades, cenários desbloqueáveis, evento sazonal mensal | Pedro, Júlia, todos |
| P0 | Arte final dos heróis (Rive) | Hoje são SVGs provisórios; a arte é o diferencial contra Forest e afins | Júlia, Pedro, Ana |
| P0 | Teste em iPhone e Android reais, tema escuro | Só foi testado iOS no Simulador | Todos |
| P1 | **Live Activity + widget** (tempo na tela bloqueada/Dynamic Island) | É o recurso mais pedido em apps de foco no iOS; ótimo item Premium | Lucas, Rafael, Ana |
| P1 | Início rápido ("repetir última sessão") e iniciar intervalo automaticamente | Menos toques para quem faz vários ciclos | Lucas, Rafael |
| P1 | Sons ambiente (chuva, festival, trem) | Concentração e imersão | Ana, Júlia, Mariana |
| P2 | Backup/sincronização (iCloud) e exportar CSV | Medo de perder a sequência ao trocar de celular | Rafael, Ana |
| P2 | Modo rígido (abandonar custa onigiri) opcional | Quem quer compromisso pede; quem tem TDAH não; por isso opcional | Rafael, Lucas |
| P3 | Bloqueio de apps (Screen Time API) | Exige permissão especial da Apple (Family Controls); alto custo | Ana, Rafael |

## 5. Monetização

### Referências de mercado

- **Forest** (o concorrente mais próximo): hoje é gratuito com compras internas (moedas, assinatura "Forest Plus"); versões antigas eram pagas (US$ 3,99). Diz ter mais de 2 milhões de pagantes (dado do próprio desenvolvedor).
- **Finch** (pet de autocuidado, mecânica parecida de "cuidar de um personagem"): gratuito + Finch Plus por cerca de US$ 9,99/mês ou US$ 69,99/ano nos EUA; estimativa de terceiros de ~US$ 1 mi/mês.
- **Benchmarks (RevenueCat 2026, Adapty)**: apps freemium convertem ~2% em pagantes; paywall rígido ~11–12%; a retenção anual dos assinantes é parecida nos dois modelos (~27–28%). Em produtividade, plano anual retém ~22% no mês 12.

### Recomendação: freemium + assinatura "Shūchū Plus", sem anúncios e sem vender onigiri

**Grátis (o app inteiro funciona):** timer completo, pausas, intervalos, notificações, 2 heróis, os 4 cenários, loja com onigiri ganhos focando, Stats de 7 dias.

**Shūchū Plus:**
- Live Activity e widgets
- Um herói novo e um evento sazonal por mês (Matsuri de verão, Hanami, Ano-novo), garantindo o fôlego de conteúdo
- Sons ambiente
- Estatísticas completas (histórico ilimitado, exportação, metas)
- Backup e sincronização no iCloud
- Temas e cenários exclusivos

**Preço sugerido** (a validar com teste de preço):

| Plano | Brasil | EUA |
|---|---|---|
| Anual (destaque, com 7 dias grátis) | R$ 59,90 | US$ 24,99 |
| Mensal | R$ 9,90 | US$ 3,99 |
| Vitalício | R$ 149,90 | US$ 49,99 |

O vitalício agrada quem odeia assinatura (Lucas, Rafael). Abaixo do Finch, porque a proposta é mais estreita.

**Também:** pacotes cosméticos avulsos (R$ 9,90–19,90) para quem não quer assinar, como a Júlia.

**Por que não:**
- **Anúncios:** contradizem a proposta de foco e irritam justamente no momento de concentração.
- **Vender onigiri:** "pagar para ganhar" esvazia o sentido de ganhar focando. É a principal crítica feita a apps do tipo.

### Contas de cabeça (ilustrativas, não previsão)

Hipóteses: 2% dos downloads viram pagantes, ticket médio anual de US$ 20 depois de descontos e mix de planos, e Apple/Google ficam com 15% (programa para pequenos desenvolvedores, até US$ 1 mi/ano).

| Downloads/mês | Pagantes novos/mês | Receita líquida/ano por coorte mensal |
|---|---|---|
| 2.000 (pessimista) | 40 | ~US$ 680 |
| 10.000 (base) | 200 | ~US$ 3.400 |
| 50.000 (otimista) | 1.000 | ~US$ 17.000 |

Ao fim de 12 meses de aquisição constante, a receita anualizada fica perto de 12× a coluna da direita, descontado o churn. No cenário base isso dá algo como US$ 30–40 mil/ano.

O que move a conta é aquisição (downloads) e conversão; o preço pesa menos.

### Custos para estar em produção

- **Contas de desenvolvedor:** US$ 99/ano na Apple e US$ 25 (taxa única) no Google.
- **Infraestrutura de builds e compras:** EAS e RevenueCat têm planos gratuitos para começar. Os dados ficam no aparelho, então não há servidor a pagar.
- **Maior custo variável: arte e animação dos heróis.** Peça orçamento a ilustradores de chibi e animadores Rive antes de decidir.
- **Tempo:** compras internas (StoreKit/RevenueCat), Live Activity, economia nova, política de privacidade, screenshots da loja e testes em aparelho real. Estimativa grosseira: 4 a 8 semanas para uma pessoa.

## 6. Compensa levar para produção?

**Sim, como lançamento enxuto para validar, não como aposta grande.**

**A favor:**
- **Base pronta e testada:** timer confiável, notificações, pausa, intervalos, i18n PT/EN, acessibilidade razoável.
- **Custo de manutenção baixo:** os dados são locais, sem servidor.
- **Diferencial claro:** heróis chibi originais, arco de episódios e Matsuri, contra um mercado de "árvores e plantinhas". Público de anime grande no Brasil e lá fora.
- **Modelo testado:** Forest e Finch mostram que gente paga por foco ou hábito com personagem.

**Contra / riscos:**
- **Categoria saturada:** sem um canal de aquisição (TikTok/Instagram de estudos, comunidades de anime e de concurso), o cenário pessimista é o mais provável.
- **Conteúdo curto (P0):** sem resolver a economia, o usuário "zera" o app em ~9 dias e some antes de ver o paywall.
- **Arte provisória:** a arte atual não sustenta screenshots de loja competitivas.
- **Nome:** checar se "Shūchū" está livre como marca nas lojas e no INPI/USPTO.

**Plano sugerido:**
1. **Semanas 1–4:** resolver P0 (economia em curva, evento mensal, arte de pelo menos 4 heróis), adicionar analytics e relatório de falhas, e testar em aparelhos reais.
2. **TestFlight / teste fechado com 50–100 pessoas.** Metas para seguir:
   - retenção D1 ≥ 35%, D7 ≥ 15%, D30 ≥ 7%;
   - ≥ 3 sessões por semana por usuário ativo;
   - avaliação qualitativa positiva das personas 1, 3 e 4.
3. **Soft launch no Brasil**, já com Plus (anual + teste de 7 dias), medindo conversão do teste em pagante. Se ficar ≥ 1,5–2%, investir em Live Activity e aquisição. Se ficar abaixo, testar paywall após o 1º arco (4 sessões), que é o momento de maior satisfação.
4. Só depois expandir para EUA e Japão.

## Fontes

- Forest na App Store: https://apps.apple.com/app/866450515 ; resenha com preço anterior: https://clickup.com/learn/topic/productivity/tools/forest/
- Finch: https://apps.apple.com/app/id1528595748 ; paywall e estimativas: https://adapty.io/paywall-library/finch/ ; resenha com preços: https://makeheadway.com/blog/finch-app-review/
- RevenueCat, State of Subscription Apps 2026: https://www.revenuecat.com/state-of-subscription-apps-2026/ ; produtividade: https://www.revenuecat.com/state-of-subscription-apps-2026-productivity
- Adapty, benchmarks de produtividade: https://adapty.io/blog/productivity-app-subscription-benchmarks/
