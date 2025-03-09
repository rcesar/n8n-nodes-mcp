// This file ensures n8n can find and load your nodes and credentials
const { McpClient } = require('./dist/nodes/McpClient/McpClient.node.js');
const { McpClientTool } = require('./dist/nodes/McpClient/McpClientTool.node.js');

module.exports = {
	nodeTypes: {
		mcpClient: McpClient,
		'CUSTOM.mcpClientTool': McpClientTool,
	},
	credentialTypes: {
		mcpClientApi: require('./dist/credentials/McpClientApi.credentials.js').McpClientApi,
	},
};
