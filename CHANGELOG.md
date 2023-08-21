<!-- markdownlint-disable MD024 -->

# Change Log

Seja Bem-Vindo a nossa página e atualização da Extensão da Discloud. Aqui você poderá ver as novas novidades.

---

## 2.14.0

### Bug fixes

- Copiar id dos apps da equipe nos detalhes do app
- API requester corrigido e melhorado

### Features

- Possibilidade de escolher apps ou apps de equipe no comando commit e outros

## 2.13.2

### Bug fixes

- Correção de rate limiting

## 2.13.1

### Bug fixes

- Corrigido ordenação de pastas e arquivos do `discloud.config#MAIN`
- Desativado re-refresh das visualizações
- Eventos desnecessários do `package.json#activationEvents` removidos

## 2.13.0

### Features

- Avatar adicionado aos apps, agora você pode vê-los
- Também adicionado avatar na lista de escolha de aplicações para commitar
- Também adicionado configuração para ver ou não avatares ao invés do status

## 2.12.3

### Bug fixes

- Corrigido limpeza errônea de aplicativos da equipe quando não tem permissão para ver o status

## 2.12.2

### Bug fixes

- Corrigido regex para substituir separador do arquivo main

## 2.12.1

### Bug fixes

- Corrigido comando upload

## 2.12.0

### Features

- Using VSCode FS instead Glob.

## 2.11.4

### Bug fixes

- Corrigido logger de erro de comandos

## 2.11.1

### Bug fixes

- Corrigido timeout do rate limiter

## 2.11.0

### Features

- Agora o app que corresponde com o ID do discloud.config é mostrado em primeiro lugar no comando `commit`

## 2.10.0

### Features

- Adicionado verificação e notificação do local do discloud.config

## 2.9.6

### Bug fixes

- Corrigido possível bug de zip

## 2.9.5

### Bug fixes

- Corrigido zip errôneo do caminho completo da raiz do sistema até o arquivo alvo quando, no caminho, existissem caracteres coringa de RegExp
- Corrigido menus de contexto quando não existiam apps disponíveis na visualização de aplicações

## 2.9.1 - 2.9.4

### Bug fixes

- Tempo do auto refresh resetado

## 2.9.0

### Features

- Auto Refresh Desativado

## 2.8.0

### Features

- Adicionado notificações de atualização de status de applicações

## 2.7.5

### Bug fixes

- Corrigido mensagem `file.zipping`

## 2.7.4

### Bug fixes

- Corrigido alternância de rate limit

### Features

- Substituído `application` por `app` nas traduções

## 2.7.3

### Bug fixes

- Corrigido opções faltando nas configurações de ordenação de apps de equipe

## 2.7.2

### Bug fixes

- Corrigido o erro que mostrava `undefined` em vez do nome predefinido

## 2.7.1

### Bug fixes

- Corrigido gerenciamento de valor de contexto na árvore de visualização de apps de equipe

## 2.7.0

### Features

- Adicionado atualizações automáticas dos aplicativos de equipe
- Esconder itens do menu de contexto de equipe por permissões
- Melhorado o gerenciamento de validação de token para visualização de usuário mostrar token faltando ou inválido

## 2.6.0

### Bug fixes

- Corrigido erro ao tentar acessar a propriedade `uri`

### Features

- Adicionado ordenação de aplicações nas visualizações

## 2.5.1

### Features

- Dicas nas visualizações de aplicativos mostrarão o status dos mesmos
- Lidar com nenhuma conexão com a internet

## 2.5.0

### Features

- Mudança na visualização de apps
- Melhor gerenciamento de configurações
- Adicionado validação do prompt do token no comando login
- Removido botão de cancelamento no progresso dos comandos
- Melhor gerenciamento da status bar ao executar comandos
- Adicionado comando para definir idioma do usuário na API
- Comando para definir idioma do usuário será re-executado com a lista de idiomas caso tenha inserido um idioma errado
- Item da visualização de subdomínios terá o mesmo status de sua aplicação

## 2.4.0

### Features

- Adicionado configuração de importação de código de seus aplicativos
- Melhorias de performance

## 2.3.3

### Bug fixes

- Corrigido título de nenhuma aplicação encontrada na visualização de apps

### Features

- Melhorias de performance na visualização de árvore de aplicativos
- Melhorias de performance nos provedores de visualização de aplicativos

## 2.3.2

### Bug fixes

- Corrigido escrever discloud.config errado
- Corrigido configurações de linguagem

## 2.3.1

### Bug fixes

- Permitir espaços no escopo MAIN

## 2.3.0

### Bug fixes

- Corrigido ignorar arquivos e pastas de .discloudignore

### Features

- Adicionado comando backup.
- Adicionado configuração de diretório de comando backup.

## 2.2.0

### Features

- Refatorar o provedor de configuração de linguagem

## 2.1.4

### Features

- Mostrar ícones de ações somente em títulos de visualização de apps

## 2.1.3

### Bug fixes

- Corrigido parar comando caso não confirme as permissões de mod nos comando de gerenciamento de equipe

### Features

- Procurar mods na API no método `Command#pickAppMod`
- Zip pastas vazias também

### Features

- Escolhas de permissões de mod são salvas para reutilização do comando

## 2.1.2

### Bug fixes

- Corrigido mensagens de aviso ao invés de informação em alguns comandos
- Corrigido mensagem de progresso persistente ao comando import ser concluído
- Corrigido nome de comando em pt

### Features

- Recusa comandos para atualizar a visualização de apps caso a atualização automática esteja habilitada

## 2.1.1

### Bugs fixes

- Corrigido execução do auto refresh

## v2.1.0

### Bugs fixes

- Corrigido mensagem de rate limit intermitente

### Features

- Adicionado logs em caso de erros em upload/commit
- Adicionado verificação melhorada de alterações no token
- Adicionado gerenciamento de MODs de aplicativos
- Alterado padrão do auto refresh para 0 (desativado)
- Adicionado debug output channel

## v2.0.0

### Bugs fixes

- Corrigido carregamento de upload infinito na barra de status
- Corrigido carregamento de informações dos aplicativos após cada ação
- Comando status agora atualiza os status na visualização do aplicativo
- Melhorias de performance em geral

### Features

- Adicionado destaque de syntax para o arquivo discloud.config
- Adicionado diagnótico de syntax para o arquivo discloud.config
- Adicionado provedor para completar parâmetros do discloud.config
- Adicionado comando para fazer um novo arquivo discloud.config
- Adicionado multi localização para inglês e português
- Adicionado visualização de equipe, domínios e subdomínios adicionados
- Adicionado novo ícone
- Adicionado auto atualizar (settings > Discloud > Auto Refresh)
- Adicionado comandos de gerenciamento de equipe, sendo eles:
  - commit
  - import
  - logs
  - ram
  - refresh
  - restart
  - start
  - status
  - stop

## v1.1.0 [BETA]

- Caixa de confirmação quando o seu aplicativo for deletado.
- Correção no algorítimo de verificação do arquivo discloud.config
- Após deletar um aplicativo, o botão upload reaparece no StatusBar do VSCode
- Agora existe um arquivo chamado .discloudignore que pode ser usando para evitar que alguma pasta ou arquivo seja enviado no upload.

## v1.0.0 [BETA]

Novas Features adicionadas na parte de **WorkSpace (Explorer)** e na **Lista de Aplicações**.

- WorkSpace
  - Upload
  - Commit
- Apps Options
  - Backup
  - Delete
  - Logs
  - Ram
  - Restart
  - Start
  - Stop
