import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Add Node.js process type declaration
declare const process: {
	env: Record<string, string | undefined>;
};

export class McpClient implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MCP Client',
		name: 'mcpClient',
		icon: 'file:mcpClient.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Use MCP client',
		defaults: {
			name: 'MCP Client',
		},
		// @ts-ignore - node-class-description-outputs-wrong
		inputs: [{ type: NodeConnectionType.Main }],
		// @ts-ignore - node-class-description-outputs-wrong
		outputs: [{ type: NodeConnectionType.Main }],
		usableAsTool: true,
		credentials: [
			{
				name: 'mcpClientApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Execute Tool',
						value: 'executeTool',
						description: 'Execute a specific tool',
						action: 'Execute a tool',
					},
					{
						name: 'Get Prompt',
						value: 'getPrompt',
						description: 'Get a specific prompt template',
						action: 'Get a prompt template',
					},
					{
						name: 'List Prompts',
						value: 'listPrompts',
						description: 'Get available prompts',
						action: 'List available prompts',
					},
					{
						name: 'List Resources',
						value: 'listResources',
						description: 'Get a list of available resources',
						action: 'List available resources',
					},
					{
						name: 'List Tools',
						value: 'listTools',
						description: 'Get available tools',
						action: 'List available tools',
					},
					{
						name: 'Read Resource',
						value: 'readResource',
						description: 'Read a specific resource by URI',
						action: 'Read a resource',
					},
				],
				default: 'listTools',
				required: true,
			},
			{
				displayName: 'Resource URI',
				name: 'resourceUri',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['readResource'],
					},
				},
				default: '',
				description: 'URI of the resource to read',
			},
			{
				displayName: 'Tool Name',
				name: 'toolName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['executeTool'],
					},
				},
				default: '',
				description: 'Name of the tool to execute',
			},
			{
				displayName: 'Tool Parameters',
				name: 'toolParameters',
				type: 'json',
				required: true,
				displayOptions: {
					show: {
						operation: ['executeTool'],
					},
				},
				default: '{}',
				description: 'Parameters to pass to the tool in JSON format',
			},
			{
				displayName: 'Prompt Name',
				name: 'promptName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['getPrompt'],
					},
				},
				default: '',
				description: 'Name of the prompt template to get',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('mcpClientApi');

		try {
			// Build environment variables object for MCP servers
			const env: Record<string, string> = {};

			// Parse comma-separated environment variables from credentials
			if (credentials.environments) {
				const envPairs = (credentials.environments as string).split(',');
				for (const pair of envPairs) {
					const trimmedPair = pair.trim();
					if (trimmedPair) {
						const equalsIndex = trimmedPair.indexOf('=');
						if (equalsIndex > 0) {
							const name = trimmedPair.substring(0, equalsIndex).trim();
							const value = trimmedPair.substring(equalsIndex + 1).trim();
							if (name && value !== undefined) {
								env[name] = value;
							}
						}
					}
				}
			}

			// Process environment variables from Node.js
			// This allows Docker environment variables to override credentials
			for (const key in process.env) {
				// Only pass through MCP-related environment variables
				if (key.startsWith('MCP_') && process.env[key]) {
					// Strip off the MCP_ prefix when passing to the MCP server
					const envName = key.substring(4); // Remove 'MCP_'
					env[envName] = process.env[key] as string;
				}
			}

			const transport = new StdioClientTransport({
				command: credentials.command as string,
				args: (credentials.args as string)?.split(' ') || [],
				env,
			});

			const client = new Client(
				{
					name: `${McpClient.name}-client`,
					version: '1.0.0',
				},
				{
					capabilities: {
						prompts: {},
						resources: {},
						tools: {},
					},
				},
			);

			await client.connect(transport);

			switch (operation) {
				case 'listResources': {
					const resources = await client.listResources();
					returnData.push({
						json: { resources },
					});
					break;
				}

				case 'readResource': {
					const uri = this.getNodeParameter('resourceUri', 0) as string;
					const resource = await client.readResource({
						uri,
					});
					returnData.push({
						json: { resource },
					});
					break;
				}

				case 'listTools': {
					const rawTools = await client.listTools();
					const tools = Array.isArray(rawTools)
						? rawTools
						: Array.isArray(rawTools?.tools)
						? rawTools.tools
						: Object.values(rawTools?.tools || {});

					if (!tools.length) {
						throw new NodeOperationError(this.getNode(), 'No tools found from MCP client');
					}

					const aiTools = tools.map((tool: any) => {
						const paramSchema = tool.inputSchema?.properties
							? z.object(
									Object.entries(tool.inputSchema.properties).reduce(
										(acc: any, [key, prop]: [string, any]) => {
											let zodType: z.ZodType;

											switch (prop.type) {
												case 'string':
													zodType = z.string();
													break;
												case 'number':
													zodType = z.number();
													break;
												case 'integer':
													zodType = z.number().int();
													break;
												case 'boolean':
													zodType = z.boolean();
													break;
												case 'array':
													if (prop.items?.type === 'string') {
														zodType = z.array(z.string());
													} else if (prop.items?.type === 'number') {
														zodType = z.array(z.number());
													} else if (prop.items?.type === 'boolean') {
														zodType = z.array(z.boolean());
													} else {
														zodType = z.array(z.any());
													}
													break;
												case 'object':
													zodType = z.record(z.string(), z.any());
													break;
												default:
													zodType = z.any();
											}

											if (prop.description) {
												zodType = zodType.describe(prop.description);
											}

											if (!tool.inputSchema?.required?.includes(key)) {
												zodType = zodType.optional();
											}

											return {
												...acc,
												[key]: zodType,
											};
										},
										{},
									),
							  )
							: z.object({});

						return new DynamicStructuredTool({
							name: tool.name,
							description: tool.description || `Execute the ${tool.name} tool`,
							schema: paramSchema,
							func: async (params) => {
								try {
									const result = await client.callTool({
										name: tool.name,
										arguments: params,
									});

									return typeof result === 'object' ? JSON.stringify(result) : String(result);
								} catch (error) {
									throw new NodeOperationError(
										this.getNode(),
										`Failed to execute ${tool.name}: ${(error as Error).message}`,
									);
								}
							},
						});
					});

					returnData.push({
						json: {
							tools: aiTools.map((t: DynamicStructuredTool) => ({
								name: t.name,
								description: t.description,
								schema: Object.keys(t.schema.shape || {}),
							})),
						},
					});
					break;
				}

				case 'executeTool': {
					const toolName = this.getNodeParameter('toolName', 0) as string;
					const toolParams = JSON.parse(this.getNodeParameter('toolParameters', 0) as string);

					const result = await client.callTool({
						name: toolName,
						arguments: toolParams,
					});

					returnData.push({
						json: { result },
					});
					break;
				}

				case 'listPrompts': {
					const prompts = await client.listPrompts();
					returnData.push({
						json: { prompts },
					});
					break;
				}

				case 'getPrompt': {
					const promptName = this.getNodeParameter('promptName', 0) as string;
					const prompt = await client.getPrompt({
						name: promptName,
					});
					returnData.push({
						json: { prompt },
					});
					break;
				}

				default:
					throw new NodeOperationError(this.getNode(), `Operation ${operation} not supported`);
			}

			return [returnData];
		} catch (error) {
			throw new NodeOperationError(
				this.getNode(),
				`Failed to execute operation: ${(error as Error).message}`,
			);
		}
	}
}
