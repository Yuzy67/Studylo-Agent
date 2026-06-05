import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getListOpenaiMessagesQueryKey } from '@workspace/api-client-react';

export function useChatStream() {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();

  const streamMessage = useCallback(async (id: number, userMessage: string, currentMode: string) => {
    setIsStreaming(true);
    setStreamingContent('');
    
    try {
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/openai/conversations/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage, mode: currentMode }),
      });
      
      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setStreamingContent(prev => prev + data.content);
              }
              if (data.done) {
                setIsStreaming(false);
                queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(id) });
              }
            } catch (e) {
              console.error('Error parsing SSE data', e);
            }
          }
        }
      }
      
      if (isStreaming) {
        setIsStreaming(false);
        queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(id) });
      }
    } catch (error) {
      console.error('Streaming error', error);
      setIsStreaming(false);
    }
  }, [queryClient, isStreaming]);

  return { streamingContent, isStreaming, streamMessage };
}

export function useDevStream() {
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [isStreaming, setIsStreaming] = useState(false);

  const streamDevOutput = useCallback(async (idea: string, outputType: string, language: string) => {
    setIsStreaming(true);
    setOutputs({});
    
    try {
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/studylo/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, outputType, language }),
      });
      
      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content && data.tab) {
                setOutputs(prev => ({
                  ...prev,
                  [data.tab]: (prev[data.tab] || '') + data.content
                }));
              }
              if (data.done) {
                setIsStreaming(false);
              }
            } catch (e) {
              console.error('Error parsing SSE data', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error', error);
      setIsStreaming(false);
    }
  }, []);

  return { outputs, isStreaming, streamDevOutput };
}
