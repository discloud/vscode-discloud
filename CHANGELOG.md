<!-- markdownlint-disable MD024 -->

# Change Log

Seja Bem-Vindo a nossa página e atualização da Extensão da Discloud. Aqui você poderá ver as novas novidades.

---

## 2.27.3

- Melhorias no upload por socket

## 2.27.1

- Mostrar nome dos clusters nos apps

## 2.27.0

- Implementamos um cache global temporário para armazenar dados do usuário e seus aplicativos para reduzir a carga de trabalho da API.

## 2.26.4

- Correção para evitar erros de validação de URL em avatares

## 2.26.3

- Agora mostra seu `username` em contas

## 2.26.2

- Corrigido um erro que mostrava que não tinha token da Discloud na inicialização

## 2.26.1

- Correção de erro grave no sistema de login

## 2.26.0

- Implementamos um novo sistema de autenticação que se integra diretamente com o VS Code, permitindo que você use seu Token da Discloud de forma mais segura e conveniente.
- Melhorias internas para tornar a extensão mais estável e confiável.

## 2.25.1

- Melhorado o tratamento de operações assíncronas e o estilo do código.

## 2.25.0

- O armazenamento de tokens foi migrado da configuração para o armazenamento secreto
- Comando de logout adicionado

## 2.24.3

- Corrigido um bug no servidor de linguagem que fazia com que o `ID` fosse obrigatório sem o `TYPE` definido

## 2.24.2

- Melhorias de desempenho no provedor de linguagem do arquivo de configuração da discloud
- Melhorias no gerenciamento do socket
- Agora vai mostrar o ID do app na saída `Discloud` quando estiver fazendo commit no nível `debug`

## 2.24.1

- Correção na manipulação da status bar com multi workspaces

## 2.24.0

- Suporte a multi workspaces adicionado
- Mudanças no arquivo de configurações da discloud  
  As propriedades NAME, RAM, TYPE e VERSION agora são opicionais  
  A única propriedade obrigatória é MAIN, para especificar o arquivo principal do app

## 2.23.15

- Melhorias no gerenciamento do socket

## 2.23.13

- Correção da status bar

## 2.23.10

- Correção do validador de autenticação

## 2.23.9

- Correção do carregamento da status bar ao inicializar a extensão

## 2.23.6

- Correção do carregamento dos comandos de configuração para mostrar avatares
- Correção na manipulação de configurações para atualizar a interface ao alterar as configurações
- Correção no analisador do arquivo de configuração da Discloud para manipular a propriedade VLAN

## 2.23.3

- Correção no tamanho do chunk de upload por websocket para evitar fechamento inesperado
- Adicionado mensagens de fechamento do websocket
- Adicionado progressão no upload de arquivos

## 2.23.2

- Corrigido bug que mostrava aplicação offline após upload, mesmo estando online

## 2.23.1

- Implementado método de commit/upload por websocket  
  Agora você pode acompanhar as etapas em tempo real  
  Isso é opcional e você pode mudar em [`⚙️discloud.api.actions.strategy`](vscode://settings/discloud.api.actions.strategy)

- Adicionado separação de apps por tipo na visualização de apps
  Você pode desativar isso em [`⚙️discloud.app.separate.by.type`](vscode://settings/discloud.app.separate.by.type)

- Substituído ação de atualizar status de vários apps por atualização individual de status do app

## 2.22.50

- Melhorias na manipulação de ações rejeitadas

## 2.22.48

- Correção definitiva do parser do discloud config
- Correção da fila de requisições à API
- Adicionado `webp` à lista de extensões de imagens permitidas em AVATAR

## 2.22.47

- Correção do parser do discloud config

## 2.22.45

- Correção de bug de validação do token JWT

## 2.22.44

- Correção de bug do discloud config parser

## 2.22.43

- Correção para [#714](https://github.com/discloud/vscode-discloud/issues/714)

## 2.22.41

- Atualização de dependências

## 2.22.32

- Correção do `commit` que não commita todos os arquivos

## 2.22.30

- Otimização da inicialização da extensão

## 2.22.28

- Correção do zip dos comandos de `upload`/`commit`

## 2.22.25

- Correção do sistema de arquivos para ignorar corretamente o que contiver no `.discloudignore`

## 2.22.24

- Correção do header do requester da api da Discloud
- Correção da exibição do avatar do app

## 2.22.23

- Melhorias de performance do sistema de linguagem do `discloud.config`
- Correção de descarte de apps ao deletá-los

## 2.22.19

- Melhorias no sistema de linguagem do `discloud.config`
- Correções e melhorias de performance

## 2.22.18

- Melhoria no status de progresso de algums comandos
- Correção no cálculo de RAM máxima disponível ao editar RAM de um app
- Diversas correções de bugs

## 2.22.17

- Correção de permissões dos comandos de mods

## 2.22.15

- Correção da detecção da pasta do workspace

## 2.22.14

- Correção de erro do `discloud.config` no comando `upload`

## 2.22.13

- Atualização dos `APTs` do `discloud.config`

## 2.22.12

- Correção de erros menores
- Melhoria de desempenho

## 2.22.10

- Correção de incompatibilidade com a nova versão do vscode (1.97.0)

## 2.22.7

- Correção de erro ao tentar atribuir valor em Response#body
- Agora mostra botão com ações vindas da API

## 2.22.6

- Correção de comportamento ao tentar fazer commit sem aplicações.

## 2.22.3

- Correção de ratelimit negativo

## 2.22.0

- 2 novos scopos do discloud.config adicionados e correção para aceitar AVATAR vazio

## 2.21.3

- Correção de bug no language provider do discloud.config [#30ec72c](https://github.com/discloud/vscode-discloud/commit/30ec72c37cefb80978e6cf6bb57672204c7a8bde)

## 2.21.0

- Refatoração do serviço de linguagem
- Melhorias no gerenciamento de apps

## 2.20.0

- refatoração

## 2.19.4

- Adicionado walkthroug.

## 2.19.3

- Permitido trocar o avatar do bot para gif, jpg, jpeg ou png.

## 2.19.1

- Sempre usar a última versão da cli no comando terminal

## 2.19.0

- Adicionado acesso ao terminal da aplicação.

## 2.18.5

- Adicionado data de expiração do plano na visualização do usuário

## 2.18.4

- Refatoração
- Corrigido erro de URI do `avatarURL`

## 2.18.3

- Correção de validação de autenticação do token
- `discloud.config` `AVATAR` e `NAME` serão atualizados após comandos de editar os mesmos

## 2.18.0

### Features

- Mudança de comportamento da status bar (após upload você pode simplesmente clicar na status bar para ver os logs, commitar ou fazer upload - como sempre - alterando a configuração `discloud.status.bar.behavior`)

## 2.17.7

- Refatoração de filas do API requester

## 2.17.6

- Instalação do pacote `path-is-absolute` para correção de inutibilidade da extensão

## 2.17.0

- Configuração `discloud.debug` adicionada
- Comandos `commit` e `upload` não apaga o zip caso a configuração `discloud.debug` esteja ativada
- Refatoração das estruturas `FileSystem` e `Zip`
- Refatoração e correção do `requester` e evento `rate limit`

## 2.16.2

- Corrigido erro de desautorização commitando num app de equipe

## 2.16.1

- Corrigido zip de arquivos duplicados

## 2.16.0

### Features

- Adicionado comandos para mudar avatar e nome dos apps

## 2.15.2

### Bug fixes

- Corrigido comando definir idioma

## 2.15.1

### Bug fixes

- Agora mostra quando não há registros

### Features

- Melhor organização do menu de contexto

## 2.15.0

### Features

- Agora você pode escolher aonde salvar o backup ou importar o código mesmo sem uma pasta aberta

## 2.14.5

### Bug fixes

- Corrigido bug que não mostrava mais apps para escolher

## 2.14.3

### Bug fixes

- Corrigido mostrando apps desligados quando estão ligados ao escolher apps
- Arquivos zip são destruídos imediatamente
- Corrigido erro `Você não está em nenhuma equipe de aplicativos` no comando `commit`

## 2.14.0

### Bug fixes

- Corrigido bug ao escolher apps de equipe

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
