import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class McpClientApi implements ICredentialType {
	name = 'mcpClientApi';
	displayName = 'MCP Client API';
	properties: INodeProperties[] = [
		{
			displayName: 'Command',
			name: 'command',
			type: 'string',
			default: '',
			required: true,
			description: 'Command to execute (e.g., npx @modelcontextprotocol/client, python script.py)',
		},
		{
			displayName: 'Arguments',
			name: 'args',
			type: 'string',
			default: '',
			description: 'Command line arguments (space-separated)',
		},
	];
}
