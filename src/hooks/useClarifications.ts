import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ClarificationMessage {
  id: string;
  report_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender_name?: string;
}

export function useClarifications(reportId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ClarificationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("clarification_messages")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching clarifications:", error);
      setLoading(false);
      return;
    }

    const list = (data as ClarificationMessage[]) ?? [];
    const senderIds = [...new Set(list.map((m) => m.sender_id))];
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", senderIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);
      list.forEach((m) => (m.sender_name = nameMap.get(m.sender_id) ?? "Användare"));
    }

    setMessages(list);
    setLoading(false);

    // Mark unread messages where I am the recipient as read
    if (user) {
      const unread = list.filter((m) => m.recipient_id === user.id && !m.read).map((m) => m.id);
      if (unread.length > 0) {
        await supabase.from("clarification_messages").update({ read: true }).in("id", unread);
      }
    }
  }, [reportId, user]);

  useEffect(() => {
    fetchMessages();
    if (!reportId) return;
    const channel = supabase
      .channel(`clarifications_${reportId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clarification_messages", filter: `report_id=eq.${reportId}` },
        () => fetchMessages(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [reportId, fetchMessages]);

  const sendMessage = async (content: string, recipientId: string) => {
    if (!user || !reportId || !content.trim()) return;
    const { error } = await supabase.from("clarification_messages").insert({
      report_id: reportId,
      sender_id: user.id,
      recipient_id: recipientId,
      content: content.trim(),
    });
    if (error) {
      toast({ title: "Kunde inte skicka meddelande", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Meddelande skickat" });
    }
  };

  return { messages, loading, sendMessage };
}
