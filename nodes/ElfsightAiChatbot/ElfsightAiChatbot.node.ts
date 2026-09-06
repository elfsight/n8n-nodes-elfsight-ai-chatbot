import type { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { PROVIDER } from './GenericFunctions';

/**
 * Declarative style on purpose: every operation here is a single GET with no dependent
 * calls or branching, so there is nothing an `execute` method would add.
 */
export class ElfsightAiChatbot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Elfsight AI Chatbot',
		name: 'elfsightAiChatbot',
		icon: { light: 'file:elfsight.svg', dark: 'file:elfsight.dark.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Read completed conversations from an Elfsight AI Chatbot widget',
		defaults: {
			name: 'Elfsight AI Chatbot',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'elfsightAiChatbotApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'conversation',
				options: [
					{
						name: 'Conversation',
						value: 'conversation',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'getMany',
				displayOptions: {
					show: {
						resource: ['conversation'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getMany',
						description:
							'Get the most recently delivered conversations, newest first, in the same shape the trigger emits',
						action: 'Get many conversations',
						routing: {
							request: {
								method: 'GET',
								url: `/ai-chat/v2/integrations/${PROVIDER}/deliveries`,
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'payload',
										},
									},
								],
							},
						},
					},
				],
			},
			{
				displayName: 'Limit',
				name: 'maxResults',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 25,
				},
				// Named `maxResults`, not `limit`: n8n-nodes-base lints a `limit`-named parameter
				// to always default to 50, but this endpoint hard-caps at 25 with no pagination.
				// 3 mirrors the server-side default.
				default: 3,
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['conversation'],
						operation: ['getMany'],
					},
				},
				routing: {
					send: {
						type: 'query',
						property: 'limit',
					},
				},
			},
		],
	};
}
