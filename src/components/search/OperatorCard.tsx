import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn, pubkeyToColor } from '@/lib/utils';
import { genUserName } from '@/lib/genUserName';
import type { OperatorInfo } from '@/types/search';

interface OperatorCardProps {
  operator: OperatorInfo;
  className?: string;
}

export function OperatorCard({ operator, className }: OperatorCardProps) {
  const navigate = useNavigate();
  const hasAnnouncement = operator.hasAnnouncement;

  const handleClick = () => {
    if (hasAnnouncement && operator.pubkey) {
      navigate(`/profile/${operator.pubkey}`);
    }
  };

  // Use genUserName as fallback when no name is available
  const displayName = operator.name || (operator.pubkey ? genUserName(operator.pubkey) : 'Anonymous');

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Generate avatar color from pubkey (consistent with CardHeader pattern)
  const avatarColor = operator.pubkey ? pubkeyToColor(operator.pubkey) : undefined;

  return (
    <Card
      onClick={hasAnnouncement ? handleClick : undefined}
      className={cn(
        'border-border bg-card h-full',
        hasAnnouncement && 'cursor-pointer transition-colors hover:bg-muted/50',
        className
      )}
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header: Label - always top left */}
        <div className="mb-2">
          <span className="text-xs text-label">Operator</span>
        </div>

        {/* Content: Avatar + Name or Badge - centered in remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <Avatar className="h-10 w-10">
            {operator.picture ? (
              <AvatarImage src={operator.picture} alt={operator.name || 'Operator'} />
            ) : null}
            <AvatarFallback
              style={hasAnnouncement && avatarColor ? { backgroundColor: avatarColor } : undefined}
              className={hasAnnouncement ? 'text-white font-bold text-sm' : ''}
            >
              {hasAnnouncement ? initials : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>

          {hasAnnouncement ? (
            <p className="text-sm font-medium text-foreground truncate max-w-full">
              {displayName}
            </p>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Not Announced
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
