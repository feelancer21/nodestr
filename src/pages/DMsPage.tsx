import { Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DMMessagingInterface } from '@/components/dm/DMMessagingInterface';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function DMsPage() {
  const { user } = useCurrentUser();

  if (!user) {
    return (
      <section className="grid gap-6">
        <Card className="border-border bg-card">
          <CardContent className="py-16 sm:py-16 flex flex-col items-center justify-center text-center">
            <Mail className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Please log in to send and receive messages.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <DMMessagingInterface
      className="h-dm-viewport"
    />
  );
}

export default DMsPage;
