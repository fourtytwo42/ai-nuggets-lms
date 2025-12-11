# OpenAI Tool Calling Implementation

## Overview

This project uses OpenAI's built-in tool calling feature (formerly function calling) for the AI tutor in Phase 5. This eliminates the need to parse JSON from AI responses and provides structured, reliable tool execution.

## How It Works

### 1. Define Tools

Tools are defined using OpenAI's tool schema format:

```typescript
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'deliver_nugget',
      description: 'Deliver a learning nugget to the learner',
      parameters: {
        type: 'object',
        properties: {
          nuggetId: {
            type: 'string',
            description: 'The ID of the nugget to deliver'
          },
          format: {
            type: 'string',
            enum: ['text', 'audio', 'multimedia'],
            description: 'How to deliver the nugget'
          }
        },
        required: ['nuggetId']
      }
    }
  },
  // ... more tools
];
```

### 2. Call OpenAI with Tools

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: conversationHistory,
  tools: tools,
  tool_choice: 'auto', // Model decides when to call tools
  temperature: 0.7
});
```

### 3. Process Tool Calls

OpenAI returns structured `tool_calls` in the response:

```typescript
const assistantMessage = response.choices[0].message;

if (assistantMessage.tool_calls) {
  for (const toolCall of assistantMessage.tool_calls) {
    // toolCall.id - unique identifier
    // toolCall.type - always 'function'
    // toolCall.function.name - 'deliver_nugget'
    // toolCall.function.arguments - JSON string (parse once)
    
    const args = JSON.parse(toolCall.function.arguments);
    // Execute tool...
  }
}
```

### 4. Return Tool Results

After executing tools, return results to OpenAI for final response:

```typescript
const finalResponse = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    ...conversationHistory,
    assistantMessage, // Original message with tool_calls
    ...toolResults.map(tr => ({
      role: 'tool' as const,
      tool_call_id: tr.toolCallId,
      content: JSON.stringify(tr.result)
    }))
  ]
});
```

## Benefits

1. **No JSON Parsing**: Tool calls are already structured
2. **Type Safety**: Define schemas for validation
3. **Multiple Tools**: Model can call multiple tools in one response
4. **Reliability**: OpenAI optimizes for tool calling
5. **Better UX**: More natural tool invocation

## Tool Definitions

See `src/services/learning-delivery/tutor.ts` for complete tool definitions:
- `deliver_nugget` - Deliver learning content
- `ask_question` - Assess understanding
- `update_mastery` - Update learner progress
- `adapt_narrative` - Change learning path
- `show_media` - Display images/videos

## References

- [OpenAI Tool Calling Documentation](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI SDK Tool Calling Guide](https://github.com/openai/openai-node#function-calling)

