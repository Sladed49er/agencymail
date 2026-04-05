"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SmsPage() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [messageText, setMessageText] = useState("");

  const { data: conversations, isLoading: convLoading } =
    trpc.sms.conversations.useQuery();

  const { data: messages, refetch: refetchMessages } =
    trpc.sms.messages.useQuery(
      { contactId: selectedContactId! },
      { enabled: !!selectedContactId }
    );

  const sendMessage = trpc.sms.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
      toast.success("Message sent");
    },
    onError: (err) => toast.error(err.message),
  });

  const markRead = trpc.sms.markRead.useMutation();

  const handleSelectConversation = (contactId: string) => {
    setSelectedContactId(contactId);
    markRead.mutate({ contactId });
  };

  const handleSend = () => {
    if (!selectedContactId || !messageText.trim()) return;
    sendMessage.mutate({
      contactId: selectedContactId,
      body: messageText.trim(),
    });
  };

  const selectedConversation = conversations?.find(
    (c) => c.contactId === selectedContactId
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          SMS Conversations
        </h1>
        <p className="text-muted-foreground">
          Send and receive text messages with your contacts.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-240px)] min-h-[500px]">
        {/* Conversation List */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {convLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !conversations || conversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No SMS conversations yet. Send a message to a contact to
                  start.
                </div>
              ) : (
                <div>
                  {conversations.map((conv) => {
                    const name = [
                      conv.contact.firstName,
                      conv.contact.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <button
                        key={conv.id}
                        onClick={() =>
                          handleSelectConversation(conv.contactId)
                        }
                        className={cn(
                          "w-full text-left p-4 border-b hover:bg-muted transition-colors",
                          selectedContactId === conv.contactId && "bg-muted"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">
                            {name || conv.contact.phone || "Unknown"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge>{conv.unreadCount}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {conv.contact.phone}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedContactId ? (
            <>
              <CardHeader className="pb-2 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {selectedConversation
                        ? [
                            selectedConversation.contact.firstName,
                            selectedConversation.contact.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ")
                        : "—"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation?.contact.phone}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {!messages || messages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 text-sm">
                      No messages yet. Send the first message below.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            msg.direction === "OUTBOUND"
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] rounded-lg px-4 py-2",
                              msg.direction === "OUTBOUND"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm">{msg.body}</p>
                            <p
                              className={cn(
                                "text-xs mt-1",
                                msg.direction === "OUTBOUND"
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatDistanceToNow(new Date(msg.sentAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <div className="p-4 border-t shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleSend()
                    }
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sendMessage.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
