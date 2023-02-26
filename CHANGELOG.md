<!-- markdownlint-disable MD024 -->

# Change Log

Seja Bem-Vindo a nossa página e atualização da Extensão da Discloud. Aqui você poderá ver as novas novidades.

---

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
