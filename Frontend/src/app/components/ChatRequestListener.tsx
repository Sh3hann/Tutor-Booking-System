/**
 * Listens for requestUpdated socket events - when tutor accepts, notifies student
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { getSocket } from '../utils/socketService';
import { toast } from 'sonner';

export function ChatRequestListener() {
  const { user } = useChatAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    // Allow when role is missing (treat as student); block only explicit tutors/admins
    if (user.role && user.role !== 'student') return;

    const socket = getSocket();
    if (!socket) return;

    const onRequestUpdated = (data: { requestId: string; status: string; threadId?: string; studentId: string }) => {
      if (data.studentId !== user.id) return;
      if (data.status === 'ACCEPTED' && data.threadId) {
        toast.success('Tutor accepted your chat request! Opening chat...');
        navigate(`/chat/${data.threadId}`);
      } else if (data.status === 'REJECTED') {
        toast.info('Tutor declined your chat request.');
      }
    };

    socket.on('requestUpdated', onRequestUpdated);
    return () => {
      socket.off('requestUpdated', onRequestUpdated);
    };
  }, [user, navigate]);

  return null;
}
