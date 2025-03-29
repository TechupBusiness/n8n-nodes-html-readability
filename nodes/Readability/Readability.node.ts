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
				displayName: 'HTML Field',
				name: 'htmlField',
				type: 'string',
				default: '',
				required: true,
				description: 'The field containing the HTML content to parse',
				noDataExpression: false,
			},
			{
				displayName: 'Error Handling',
				name: 'errorHandling',
				type: 'options',
				options: [
					{
						name: 'Pass Through',
						value: 'passThrough',
						description: 'Pass through the input if HTML is invalid',
					},
					{
						name: 'Output Empty',
						value: 'outputEmpty',
						description: 'Output empty content if HTML is invalid',
					},
					{
						name: 'Throw Error',
						value: 'throwError',
						description: 'Stop execution with error if HTML is invalid',
					},
				],
				default: 'throwError',
				description: 'How to handle invalid HTML content',
			},
			{
				displayName: 'Return Full Response',
				name: 'fullResponse',
				type: 'boolean',
				default: false,
				description: 'Whether to return the full response from Readability (includes metadata)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		if (items.length === 0) {
			return [[]];
		}

		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const errorHandling = this.getNodeParameter('errorHandling', i, 'throwError') as 'passThrough' | 'outputEmpty' | 'throwError';
			const fullResponse = this.getNodeParameter('fullResponse', i, false) as boolean;

			try {
				const item = items[i];
				if (!item?.json) {
					throw new NodeOperationError(this.getNode(), `Item ${i} has no JSON data`, { itemIndex: i });
				}

				const htmlContent = this.getNodeParameter('htmlField', i) as string;

				const dom = new JSDOM(htmlContent);
				const reader = new MozillaReadability(dom.window.document);
				const article = reader.parse() as ReadabilityArticle | null;

				if (!article) {
					throw new NodeOperationError(this.getNode(), 'Failed to extract content');
				}

				if (fullResponse) {
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
				if (errorHandling === 'passThrough') {
					returnData.push(items[i]);
					continue;
				}
				if (errorHandling === 'outputEmpty') {
					returnData.push({
						json: {
							content: '',
							title: '',
							excerpt: '',
						},
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), `Error processing HTML: ${(error as Error).message}`, { itemIndex: i });
			}
		}

		return [returnData];
	}
} 