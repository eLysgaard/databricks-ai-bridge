import type { LanguageModelV2, ProviderV2 } from '@ai-sdk/provider'
import { combineHeaders, type FetchFunction, withoutTrailingSlash } from '@ai-sdk/provider-utils'
import { DatabricksChatAgentLanguageModel } from './chat-agent-language-model/chat-agent-language-model'
import { DatabricksResponsesLanguageModel } from './responses-language-model/responses-language-model'
import { DatabricksChatCompletionsLanguageModel } from './chat-completions-language-model/chat-completions-language-model'

export type DatabricksLanguageModelConfig = {
  provider: string
  headers: () => Record<string, string | undefined>
  url: (options: { path: string }) => string
  fetch?: FetchFunction
}

export interface DatabricksProvider extends ProviderV2 {
  /** Agents */
  chatAgent(modelId: string): LanguageModelV2 // agent/v2/chat
  responses(modelId: string): LanguageModelV2 // agent/v1/responses

  /** Foundation Models */
  chatCompletions(modelId: string): LanguageModelV2 // llm/v1/chat
}

export interface DatabricksProviderSettings {
  /** Base URL for the Databricks API calls. */
  baseURL: string
  /** Custom headers to include in the requests. */
  headers?: Record<string, string>
  /** Provider name. Overrides the `databricks` default name for 3rd party providers. */
  provider?: string

  /**
   * Custom fetch implementation. You can use it as a middleware to intercept requests,
   * or to provide a custom fetch implementation for e.g. testing.
   * */
  fetch?: FetchFunction

  /**
   * Optional function to format the URL
   */
  formatUrl?: (options: { baseUrl?: string; path: string }) => string
}

export const createDatabricksProvider = (
  settings: DatabricksProviderSettings
): DatabricksProvider => {
  const baseUrl = withoutTrailingSlash(settings.baseURL)
  const getHeaders = () => combineHeaders(settings.headers)
  const fetch = settings.fetch
  const provider = settings.provider ?? 'databricks'

  const formatUrl = ({ path }: { path: string }) =>
    settings.formatUrl?.({ baseUrl, path }) ?? `${baseUrl}${path}`

  const createChatAgent = (modelId: string): LanguageModelV2 =>
    new DatabricksChatAgentLanguageModel(modelId, {
      url: formatUrl,
      headers: getHeaders,
      fetch,
      provider,
    })

  const createResponses = (modelId: string): LanguageModelV2 =>
    new DatabricksResponsesLanguageModel(modelId, {
      url: formatUrl,
      headers: getHeaders,
      fetch,
      provider,
    })

  const createChatCompletions = (modelId: string): LanguageModelV2 =>
    new DatabricksChatCompletionsLanguageModel(modelId, {
      url: formatUrl,
      headers: getHeaders,
      fetch,
      provider,
    })

  const notImplemented = (name: string) => {
    return () => {
      throw new Error(`${name} is not supported yet`)
    }
  }

  return {
    responses: createResponses,
    chatCompletions: createChatCompletions,
    chatAgent: createChatAgent,
    imageModel: notImplemented('ImageModel'),
    textEmbeddingModel: notImplemented('TextEmbeddingModel'),
    languageModel: notImplemented('LanguageModel'),
  }
}
