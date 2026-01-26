import { z } from 'zod/v4'

/**
 * Response schema
 */
const responsesMessageSchema = z.object({
  type: z.literal('message'),
  role: z.literal('assistant'),
  id: z.string(),
  content: z.array(
    z.object({
      type: z.literal('output_text'),
      text: z.string(),
      logprobs: z.unknown().nullish(),
      annotations: z.array(
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('url_citation'),
            start_index: z.number(),
            end_index: z.number(),
            url: z.string(),
            title: z.string(),
          }),
        ])
      ),
    })
  ),
})

const responsesFunctionCallSchema = z.object({
  type: z.literal('function_call'),
  call_id: z.string(),
  name: z.string(),
  arguments: z.string(),
  id: z.string(),
})

const responsesReasoningSchema = z.object({
  type: z.literal('reasoning'),
  id: z.string(),
  encrypted_content: z.string().nullish(),
  summary: z.array(
    z.object({
      type: z.literal('summary_text'),
      text: z.string(),
    })
  ),
})

const responsesFunctionCallOutputSchema = z.object({
  type: z.literal('function_call_output'),
  call_id: z.string(),
  output: z.any(),
})

const responsesMcpApprovalRequestSchema = z.object({
  type: z.literal('mcp_approval_request'),
  id: z.string(),
  name: z.string(),
  arguments: z.string(),
  server_label: z.string(),
})

const responsesMcpApprovalResponseSchema = z.object({
  type: z.literal('mcp_approval_response'),
  id: z.string().optional(),
  approval_request_id: z.string(),
  approve: z.boolean(),
  reason: z.string().nullish(),
})

const responsesOutputItem = z.discriminatedUnion('type', [
  responsesMessageSchema,
  responsesFunctionCallSchema,
  responsesReasoningSchema,
  responsesFunctionCallOutputSchema,
  responsesMcpApprovalRequestSchema,
  responsesMcpApprovalResponseSchema,
])

export const responsesResponseSchema = z.object({
  id: z.string().optional(),
  created_at: z.number().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .nullish(),
  model: z.string().optional(),
  output: z.array(responsesOutputItem),
  incomplete_details: z
    .object({
      reason: z.string().nullish().optional(),
    })
    .nullish(),
  usage: z
    .object({
      input_tokens: z.number(),
      output_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
})

/**
 * Chunk schema
 */

const textDeltaChunkSchema = z.object({
  type: z.literal('response.output_text.delta'),
  item_id: z.string(),
  delta: z.string(),
  logprobs: z.unknown().nullish(),
})

const errorChunkSchema = z.object({
  type: z.literal('error'),
  code: z.string(),
  message: z.string(),
  param: z.string().nullish(),
  sequence_number: z.number(),
})

export const simpleErrorChunkSchema = z.object({
  type: z.undefined().optional(),
  error: z.string(),
})

const responseOutputItemDoneSchema = z.object({
  type: z.literal('response.output_item.done'),
  output_index: z.number(),
  item: responsesOutputItem,
})

const responseAnnotationAddedSchema = z.object({
  type: z.literal('response.output_text.annotation.added'),
  annotation: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('url_citation'),
      url: z.string(),
      title: z.string(),
    }),
  ]),
})

const responseReasoningSummaryTextDeltaSchema = z.object({
  type: z.literal('response.reasoning_summary_text.delta'),
  item_id: z.string(),
  summary_index: z.number(),
  delta: z.string(),
})

const responseFunctionCallArgumentsDeltaSchema = z.object({
  type: z.literal('response.function_call_arguments.delta'),
  item_id: z.string(),
  delta: z.string(),
  output_index: z.number(),
  sequence_number: z.number(),
})

const functionCallOutputChunkSchema = z.object({
  type: z.literal('function_call_output'),
  call_id: z.string(),
  output: z.any(),
})

const responsesCompletedSchema = z.object({
  type: z.literal('responses.completed'),
  response: z.object({
    id: z.string(),
    status: z
      .enum(['completed', 'failed', 'in_progress', 'cancelled', 'queued', 'incomplete'])
      .optional(),
    incomplete_details: z
      .object({
        reason: z.string().nullish().optional(),
      })
      .nullish(),
    usage: z.object({
      input_tokens: z.number(),
      output_tokens: z.number(),
      total_tokens: z.number(),
    }),
  }),
})

export const responsesChunkSchema = z.union([
  textDeltaChunkSchema,
  responseOutputItemDoneSchema,
  responseAnnotationAddedSchema,
  responseReasoningSummaryTextDeltaSchema,
  responseFunctionCallArgumentsDeltaSchema,
  functionCallOutputChunkSchema,
  errorChunkSchema,
  responsesCompletedSchema,
  simpleErrorChunkSchema,
])

/**
 * We use a loose schema for response validation to handle unknown chunks.
 */
export const looseResponsesChunkSchema = z.union([
  responsesChunkSchema,
  z.object({ type: z.string() }).loose(), // fallback for unknown chunks
])

// Exported types for type-only imports in other modules
export type ResponsesChunk = z.infer<typeof responsesChunkSchema>
export type ResponsesResponse = z.infer<typeof responsesResponseSchema>
