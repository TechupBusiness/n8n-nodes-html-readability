import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { JSDOM } from 'jsdom';
import { Readability as MozillaReadability } from '@mozilla/readability';

interface ReadabilityArticle {
	title: string | null;
	content: string | null;
	textContent: string | null;
	length: number;
	excerpt: string | null;
	byline: string | null;
	dir: string | null;
	siteName: string | null;
}

export class Readability implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Readability',
		name: 'readability',
		icon: 'file:readability.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["htmlField"]}}',
		description: 'Extract readable content from HTML using Mozilla Readability',
		defaults: {
			name: 'Readability',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'HTML',
						value: 'html',
					},
				],
				default: 'html',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['html'],
					},
				},
				options: [
					{
						name: 'Extract Content',
						value: 'extract',
						description: 'Wether to extract readable content from HTML',
						action: 'Extract readable content from HTML',
					},
				],
				default: 'extract',
			},
			{
				displayName: 'JSON Property',
				name: 'htmlField',
				type: 'string',
				default: 'html',
				required: true,
				displayOptions: {
					show: {
						resource: ['html'],
						operation: ['extract'],
					},
				},
				description: 'The name of the JSON property containing the HTML content to parse (supports dot notation and expressions)',
				noDataExpression: false,
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['html'],
						operation: ['extract'],
					},
				},
				options: [
					{
						displayName: 'Continue on Error',
						name: 'continueOnFail',
						type: 'boolean',
						default: false,
						description: 'Whether to continue with execution even when the node encounters an error',
					},
					{
						displayName: 'Return Full Response',
						name: 'fullResponse',
						type: 'boolean',
						default: false,
						description: 'Whether to return the full response from Readability (includes metadata)',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		if (items.length === 0) {
			// Return empty array if no input items
			return [[]];
		}

		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		if (resource === 'html' && operation === 'extract') {
			for (let i = 0; i < items.length; i++) {
				const options = this.getNodeParameter('options', i, {}) as {
					continueOnFail?: boolean;
					fullResponse?: boolean;
				};

				try {
					const item = items[i];
					if (!item?.json) {
						throw new NodeOperationError(this.getNode(), `Item ${i} has no JSON data`);
					}

					// Get htmlField for each item to support expressions that might change per item
					const htmlField = this.getNodeParameter('htmlField', i) as string;

					// Handle both expression results and dot notation
					let htmlContent: any;
					
					// First check if the field contains a direct value from an expression
					if (typeof htmlField === 'string' && htmlField.includes('.')) {
						// Handle dot notation
						const pathParts = htmlField.split('.');
						htmlContent = item.json;
						
						for (const part of pathParts) {
							if (htmlContent && typeof htmlContent === 'object' && part in htmlContent) {
								htmlContent = htmlContent[part];
							} else {
								htmlContent = undefined;
								break;
							}
						}
					} else {
						// Direct value (either from expression or simple field)
						htmlContent = item.json[htmlField];
					}

					if (!htmlContent) {
						throw new NodeOperationError(this.getNode(), `No HTML found in field "${htmlField}" for item ${i}`);
					}

					const dom = new JSDOM(htmlContent);
					const reader = new MozillaReadability(dom.window.document);
					const article = reader.parse() as ReadabilityArticle | null;

					if (!article) {
						throw new NodeOperationError(this.getNode(), 'Failed to extract content');
					}

					if (options.fullResponse) {
						returnData.push({
							json: {
								...article,
							},
						});
					} else {
						returnData.push({
							json: {
								content: article.content,
								title: article.title,
								excerpt: article.excerpt,
							},
						});
					}

				} catch (error) {
					if (options.continueOnFail || this.continueOnFail()) {
						returnData.push({
							json: {
								error: error instanceof Error ? error.message : 'An unknown error occurred',
								item: i,
							},
						});
						continue;
					}
					throw error;
				}
			}
		}

		return [returnData];
	}
} 