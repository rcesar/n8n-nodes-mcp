# n8n-nodes-mcp-client

This is an n8n community node that lets you interact with Model Context Protocol (MCP) servers in your n8n workflows.

MCP is a protocol that enables AI models to interact with external tools and data sources in a standardized way. This node allows you to connect to MCP servers, access resources, execute tools, and use prompts.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Credentials](#credentials)  
[Operations](#operations)  
[Compatibility](#compatibility)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Credentials

The MCP Client node requires credentials to connect to an MCP server:

![MCP Client Credentials](./assets/credentials.png)

- **Command**: The command to start the MCP server
- **Arguments**: Optional arguments to pass to the server command

## Operations

The MCP Client node supports the following operations:

![MCP Client Operations](./assets/operations.png)

- **Execute Tool** - Execute a specific tool with parameters
- **Get Prompt** - Get a specific prompt template
- **List Prompts** - Get a list of available prompts
- **List Resources** - Get a list of available resources from the MCP server
- **List Tools** - Get a list of available tools
- **Read Resource** - Read a specific resource by URI

### Example: List Tools Operation

![List Tools Example](./assets/listTools.png)

The List Tools operation returns all available tools from the MCP server, including their names, descriptions, and parameter schemas.

## Compatibility

- Requires n8n version 1.0.0 or later
- Compatible with MCP Protocol version 1.0.0 or later

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Model Context Protocol Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
* [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)


