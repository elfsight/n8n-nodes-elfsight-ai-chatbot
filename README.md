# n8n-nodes-elfsight-ai-chatbot

An [n8n](https://n8n.io/) community node for the **Elfsight AI Chatbot**.

The Elfsight AI Chatbot is a website widget that answers visitor questions from your own
knowledge base and collects leads. This package starts a workflow every time a conversation
is completed, and lets you pull recent conversations on demand.

[Installation](#installation) · [Nodes](#nodes) · [Credentials](#credentials) ·
[Usage](#usage) · [Limitations](#limitations) · [Development](#development)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)
and install `n8n-nodes-elfsight-ai-chatbot`.

## Nodes

### Elfsight AI Chatbot Trigger

Fires when a chat is closed and its post-analysis has finished, so the payload already contains
the topic, summary and knowledge gaps. The node registers and removes the subscription for you
when you activate or deactivate the workflow — there is no URL to copy anywhere.

Output (one item per conversation):

| Field | Description |
|---|---|
| `threadPid`, `assistantPid`, `widgetPid` | Identifiers of the conversation, chatbot and widget |
| `timeZone`, `chatStarted`, `duration` | When the chat happened and how long it lasted |
| `sourcePage` | Page the visitor chatted from |
| `chatTopic`, `summary` | Post-analysis of the conversation |
| `leadName`, `leadEmail`, `leadPhone` | Contact details, when the visitor left them |
| `knowledgeGaps` | Questions the chatbot could not answer: `shortName`, `summary` |
| `transcript` | Full message list — see the fields below |
| `dashboardLink` | Direct link to the conversation in the Elfsight dashboard |

Each `transcript` entry:

| Field | Description |
|---|---|
| `role` | `User`, `AI Agent` or `System` |
| `message` | Message text, markup stripped |
| `dateTime` | ISO 8601 timestamp, may be `null` |
| `rating` | `good` or `bad` if the visitor rated the answer, otherwise `null` |
| `widgets` | Interactive widgets the assistant embedded in the message (empty for most messages) |
| `attachments` | Files attached to the message (empty for most messages) |

A `widgets` entry has `type` (`collectContacts`, `actionButtons` or `contactHuman`),
`fields` (list of field labels), `buttons` (list of button labels) and `caption`.

An `attachments` entry has `name`, `type` (`image` or `file`), `url` and `fileSize` in bytes.

### Elfsight AI Chatbot

Resource **Conversation**, operation **Get Many** — returns the most recently delivered
conversations, newest first, in exactly the same shape the trigger emits. Handy for mapping
fields while building a workflow, without waiting for a live chat.

## Credentials

1. Open your AI Chatbot widget in the Elfsight dashboard and add the **n8n** integration.
2. Copy the API key (`elf_…`) — it is shown **only once**.
3. In n8n create an *Elfsight AI Chatbot API* credential and paste the key.

Leave **Base URL** at `https://widget-data.service.elfsight.com/api` unless Elfsight gave you another endpoint.
Use **Test** to confirm the key: it calls `/ai-chat/v2/integrations/me` and shows the connected
chatbot's name.

## Usage

1. Add **Elfsight AI Chatbot Trigger** to a workflow and select your credential.
2. Activate the workflow — the node subscribes automatically.
3. Have a chat on your site and close it. Once post-analysis completes, the workflow runs.

To design the workflow without waiting for a real chat, use the **Elfsight AI Chatbot** node's
*Get Many* operation to pull the last few conversations and map the fields from there.

## Limitations

**One API key serves one workflow.** The key is bound to a single subscription, so:

- *Listen for test event* on an **already active** workflow tries to register a second
  (test) URL and fails with a conflict — deactivate the workflow first;
- a second workflow on the same credential fails the same way — add another n8n integration
  in the Elfsight dashboard and use the new key.

**HTTPS with a public domain is required.** Self-hosted n8n reachable only over `http://` or on
a private hostname cannot be subscribed.

**Disabling in the dashboard is respected.** If the widget owner turns the integration off in
the Elfsight dashboard, the subscription stays registered but stops delivering. The node will
not silently switch it back on — re-enable it in the dashboard.

## Development

```bash
npm install
npm run dev     # runs n8n with this node linked
npm run lint
npm run build
```

Because Elfsight pushes conversations to your n8n instance, local development needs a publicly
reachable URL: run a tunnel and point `WEBHOOK_URL` at it, otherwise the subscription registers
an address Elfsight cannot reach.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Elfsight AI Chatbot](https://elfsight.com/ai-chatbot-widget/)

## License

[MIT](LICENSE.md)
