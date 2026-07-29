/**
 * CollaborativeAIDialog Component
 * Multi-turn conversation dialog for collaborative AI interactions
 */

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { AIMessage } from "@/types/ai";
import { Loader2, Send, Sparkles, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CollaborativeAIDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: (output: string) => void;
  title: string;
  description: string;
  initialMessage?: string;
  onSendMessage: (message: string, history: AIMessage[]) => Promise<string>;
  onSynthesize?: (history: AIMessage[]) => Promise<string>;
  confirmLabel?: string;
  showSynthesize?: boolean;
}

export const CollaborativeAIDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  initialMessage,
  onSendMessage,
  onSynthesize,
  confirmLabel = "Confirm",
  showSynthesize = false,
}: CollaborativeAIDialogProps) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [synthesizedOutput, setSynthesizedOutput] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with AI's first message if provided
  useEffect(() => {
    if (open && initialMessage && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: initialMessage,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [open, initialMessage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await onSendMessage(userMessage.content, messages);
      const aiMessage: AIMessage = {
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      setMessages([...newMessages, aiMessage]);
    } catch (error) {
      const errorMessage: AIMessage = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
        timestamp: Date.now(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSynthesize = async () => {
    if (!onSynthesize || isSynthesizing) return;

    setIsSynthesizing(true);
    try {
      const output = await onSynthesize(messages);
      setSynthesizedOutput(output);
    } catch (error) {
      setSynthesizedOutput(`Error: ${error instanceof Error ? error.message : "Failed to synthesize"}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleConfirm = () => {
    if (onConfirm && synthesizedOutput) {
      onConfirm(synthesizedOutput);
    }
    handleClose();
  };

  const handleClose = () => {
    setMessages([]);
    setInput("");
    setSynthesizedOutput(null);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Conversation */}
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="space-y-4 pr-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <Card
                    className={`max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="prose dark:prose-invert max-w-none text-sm">
                        {message.role === "assistant" ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="m-0">{message.content}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Synthesized Output Preview */}
          {synthesizedOutput && (
            <Card className="border-primary">
              <CardContent className="p-4">
                <div className="prose dark:prose-invert max-w-none text-sm max-h-48 overflow-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {synthesizedOutput}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              disabled={isLoading}
              className="flex-1 min-h-[60px]"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading || isSynthesizing}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          {showSynthesize && !synthesizedOutput && (
            <Button
              onClick={handleSynthesize}
              disabled={messages.length === 0 || isSynthesizing || isLoading}
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Synthesizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Synthesize
                </>
              )}
            </Button>
          )}
          {synthesizedOutput && onConfirm && (
            <Button onClick={handleConfirm}>
              <Check className="w-4 h-4 mr-2" />
              {confirmLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

