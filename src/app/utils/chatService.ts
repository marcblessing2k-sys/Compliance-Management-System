import { requireSupabase } from '../../lib/supabase';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ChatConversation {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export async function sendMessage(
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  message: string
): Promise<ChatMessage> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      sender_id: senderId,
      sender_name: senderName,
      receiver_id: receiverId,
      receiver_name: receiverName,
      message,
      read: false
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    senderId: data.sender_id,
    senderName: data.sender_name,
    receiverId: data.receiver_id,
    receiverName: data.receiver_name,
    message: data.message,
    timestamp: data.created_at,
    read: data.read
  };
}

export async function getConversation(user1Id: string, user2Id: string): Promise<ChatMessage[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`
    )
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapMessage);
}

function mapMessage(row: {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  message: string;
  created_at: string;
  read: boolean;
}): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    receiverId: row.receiver_id,
    receiverName: row.receiver_name,
    message: row.message,
    timestamp: row.created_at,
    read: row.read
  };
}

export async function getConversations(currentUserId: string): Promise<ChatConversation[]> {
  const supabase = requireSupabase();
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const { data: profiles } = await supabase.from('profiles').select('id, name, email, role, status');
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  const conversationMap = new Map<string, ChatConversation>();

  (messages ?? []).forEach(msg => {
    const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
    const otherUserName = msg.sender_id === currentUserId ? msg.receiver_name : msg.sender_name;
    const isUnread = msg.receiver_id === currentUserId && !msg.read;
    const otherUser = profileMap.get(otherUserId);

    const existing = conversationMap.get(otherUserId);
    if (!existing) {
      conversationMap.set(otherUserId, {
        userId: otherUserId,
        userName: otherUserName,
        userEmail: otherUser?.email ?? '',
        userRole: otherUser?.role ?? 'user',
        lastMessage: msg.message,
        lastMessageTime: msg.created_at,
        unreadCount: isUnread ? 1 : 0
      });
    } else if (isUnread) {
      existing.unreadCount++;
    }
  });

  return Array.from(conversationMap.values()).sort((a, b) => {
    const timeA = new Date(a.lastMessageTime || 0).getTime();
    const timeB = new Date(b.lastMessageTime || 0).getTime();
    return timeB - timeA;
  });
}

export async function markConversationAsRead(currentUserId: string, otherUserId: string): Promise<void> {
  const supabase = requireSupabase();
  await supabase
    .from('chat_messages')
    .update({ read: true })
    .eq('receiver_id', currentUserId)
    .eq('sender_id', otherUserId)
    .eq('read', false);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = requireSupabase();
  const { count, error } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('read', false);
  if (error) throw error;
  return count ?? 0;
}

export async function getAllUsers(excludeUserId?: string) {
  const supabase = requireSupabase();
  let query = supabase.from('profiles').select('id, name, email, role, status').eq('status', 'active');
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? [])
    .filter(u => u.id !== excludeUserId)
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email ?? '',
      role: u.role,
      status: u.status
    }));
}

export async function deleteMessage(messageId: string): Promise<void> {
  const supabase = requireSupabase();
  await supabase.from('chat_messages').delete().eq('id', messageId);
}

export async function deleteConversation(user1Id: string, user2Id: string): Promise<void> {
  const supabase = requireSupabase();
  await supabase
    .from('chat_messages')
    .delete()
    .or(
      `and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`
    );
}
