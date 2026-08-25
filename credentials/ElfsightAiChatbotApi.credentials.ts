import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class ElfsightAiChatbotApi implements ICredentialType {
	name = 'elfsightAiChatbotApi';

	displayName = 'Elfsight AI Chatbot API';

	icon: Icon = 'file:../nodes/ElfsightAiChatbot/elfsight.svg';

	documentationUrl = 'https://github.com/elfsight/n8n-nodes-elfsight-ai-chatbot#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			placeholder: 'elf_...',
			description:
				'Issued in the Elfsight dashboard when you add the n8n integration to an AI Chatbot widget. It is shown only once — copy it right away.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://widget-data.service.elfsight.com/api',
			description: 'Change only if you were given a different Elfsight API endpoint',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/ai-chat/v2/integrations/me',
			method: 'GET',
		},
	};
}
