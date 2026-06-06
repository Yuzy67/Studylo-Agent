import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getListOpenaiMessagesQueryKey, getListOpenaiConversationsQueryKey } from '@workspace/api-client-react';

async function readSSE(
  response: Response,
  onChunk: (content: string) => void,
  onError: (msg: string) => void
): Promise<string> {
  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.content) {
          fullText += data.content;
          onChunk(data.content);
        }
        if (data.error) {
          onError(data.error);
        }
      } catch {
        // ignore malformed lines
      }
    }
  }

  return fullText;
}

export function useChatStream() {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const isStreamingRef = useRef(false);

  const streamMessage = useCallback(async (
    conversationId: number,
    userMessage: string,
    mode: string
  ): Promise<string> => {
    isStreamingRef.current = true;
    setIsStreaming(true);
    setStreamingContent('');
    setStreamError(null);

    let finalContent = '';

    try {
      const baseUrl = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/openai/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage, mode }),
      });

      if (!response.ok && !response.body) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error ?? 'Request failed');
      }

      finalContent = await readSSE(
        response,
        (chunk) => setStreamingContent((prev) => prev + chunk),
        (msg) => setStreamError(msg)
      );

      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Streaming failed';
      setStreamError(msg);
      console.error('Chat stream error:', err);
    } finally {
      isStreamingRef.current = false;
      setIsStreaming(false);
    }

    return finalContent;
  }, [queryClient]);

  return { streamingContent, isStreaming, streamError, streamMessage };
}

export function useDevStream() {
  const [output, setOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const streamDevOutput = useCallback(async (
    idea: string,
    outputType: string,
    language: string
  ): Promise<void> => {
    setIsStreaming(true);
    setOutput('');
    setStreamError(null);

    try {
      const baseUrl = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/studylo/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, outputType, language }),
      });

      if (!response.ok && !response.body) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error ?? 'Request failed');
      }

      await readSSE(
        response,
        (chunk) => setOutput((prev) => prev + chunk),
        (msg) => setStreamError(msg)
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Streaming failed';
      setStreamError(msg);
      console.error('Dev stream error:', err);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { output, isStreaming, streamError, streamDevOutput };
}
