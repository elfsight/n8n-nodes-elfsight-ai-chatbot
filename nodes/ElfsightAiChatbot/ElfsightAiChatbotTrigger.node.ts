import type {
	IDataObject,
	IHookFunctions,
	JsonObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { PROVIDER, elfsightApiRequest, statusCodeOf } from './GenericFunctions';

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

interface SubscriptionResponse {
	pid: string;
}

export class ElfsightAiChatbotTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Elfsight AI Chatbot Trigger',
		name: 'elfsightAiChatbotTrigger',
		icon: { light: 'file:elfsight.svg', dark: 'file:elfsight.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when an Elfsight AI Chatbot conversation is completed',
		defaults: {
			name: 'Elfsight AI Chatbot Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'elfsightAiChatbotApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'conversationCompleted',
				description: 'Which chatbot event starts this workflow',
				options: [
					{
						name: 'Conversation Completed',
						value: 'conversationCompleted',
						description:
							'A chat was closed and post-analysis finished, so the topic, summary and knowledge gaps are filled in',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			/**
			 * Elfsight answers 404 while the subscription is pending or gone, so any 2xx means
			 * "keep it". A subscription the widget owner disabled in the dashboard still answers
			 * 200 (with `enabled: false`) on purpose — recreating it here would silently switch
			 * delivery back on behind their back.
			 */
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const subscriptionId = staticData.subscriptionId as string | undefined;

				if (subscriptionId === undefined) {
					return false;
				}

				try {
					await elfsightApiRequest.call(
						this,
						'GET',
						`/ai-chat/v2/integrations/${PROVIDER}/subscriptions/${subscriptionId}`,
					);

					return true;
				} catch (error) {
					if (statusCodeOf(error) === HTTP_NOT_FOUND) {
						delete staticData.subscriptionId;

						return false;
					}

					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');

				try {
					const subscription = (await elfsightApiRequest.call(
						this,
						'POST',
						`/ai-chat/v2/integrations/${PROVIDER}/subscribe`,
						{ targetUrl: this.getNodeWebhookUrl('default') } as IDataObject,
					)) as SubscriptionResponse;

					staticData.subscriptionId = subscription.pid;

					return true;
				} catch (error) {
					if (statusCodeOf(error) === HTTP_CONFLICT) {
						throw new NodeOperationError(
							this.getNode(),
							'This Elfsight API key is already subscribed to another URL',
							{
								description:
									'One API key serves one webhook URL. To listen for a test event, deactivate the workflow first. To run a second workflow, add another n8n integration in the Elfsight dashboard and use its new API key.',
							},
						);
					}

					throw new NodeApiError(this.getNode(), error as JsonObject);
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const subscriptionId = staticData.subscriptionId as string | undefined;

				if (subscriptionId === undefined) {
					return true;
				}

				try {
					await elfsightApiRequest.call(
						this,
						'DELETE',
						`/ai-chat/v2/integrations/${PROVIDER}/unsubscribe/${subscriptionId}`,
					);
				} catch (error) {
					// Already gone on the Elfsight side — nothing left to clean up remotely.
					if (statusCodeOf(error) !== HTTP_NOT_FOUND) {
						throw new NodeApiError(this.getNode(), error as JsonObject);
					}
				}

				delete staticData.subscriptionId;

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		return {
			workflowData: [this.helpers.returnJsonArray(this.getBodyData())],
		};
	}
}
