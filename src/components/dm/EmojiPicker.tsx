import { useState } from 'react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTheme } from '@/hooks/useTheme';

interface EmojiPickerButtonProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPickerButton({ onEmojiSelect, disabled }: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();

  const pickerTheme = theme === 'dark' ? Theme.DARK : theme === 'light' ? Theme.LIGHT : Theme.AUTO;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
          disabled={disabled}
        >
          <Smile className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" side="top">
        <EmojiPicker
          onEmojiClick={(emojiData: EmojiClickData) => {
            onEmojiSelect(emojiData.emoji);
          }}
          theme={pickerTheme}
          width={300}
          height={380}
          style={{ '--epr-emoji-size': '26px', '--epr-emoji-padding': '4px' } as React.CSSProperties}
          previewConfig={{ showPreview: false }}
          searchPlaceholder="Search emoji..."
          lazyLoadEmojis
        />
      </PopoverContent>
    </Popover>
  );
}
