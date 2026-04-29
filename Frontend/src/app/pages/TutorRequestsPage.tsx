/**
 * Tutor page: view pending chat requests, accept/reject
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { chatApi } from '../utils/chatApi';
import { useChatAuth } from '../contexts/ChatAuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Check, X, MessageSquare } from 'lucide-react';

export function TutorRequestsPage() {
  const navigate = useNavigate();
  const { user } = useChatAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/tutor/login');
      return;
    }
    if (user.role !== 'tutor') {
      navigate('/tutor/dashboard');
      return;
    }
    loadRequests();
  }, [user, navigate]);

  const loadRequests = async () => {
    try {
      const result = await chatApi.getTutorPendingRequests('PENDING');
      setRequests(result.requests || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const result = await chatApi.acceptRequest(requestId);
      toast.success('Chat request accepted!');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (result.threadId) {
        navigate(`/chat/${result.threadId}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await chatApi.rejectRequest(requestId);
      toast.success('Request rejected');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/tutor/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Chat Requests</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No pending requests</h3>
              <p className="text-white/70">Students will appear here when they request to chat with you.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {req.student?.fullName || 'Student'}
                  </CardTitle>
                  <p className="text-sm text-white/50">
                    {new Date(req.createdAt).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    onClick={() => handleAccept(req.id)}
                    disabled={processingId === req.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(req.id)}
                    disabled={processingId === req.id}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
