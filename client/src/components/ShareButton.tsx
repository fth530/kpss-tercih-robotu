import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Twitter, MessageCircle, Link2, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareButtonProps {
  position: {
    osymCode: string;
    institution: string;
    title: string;
    city: string;
  };
}

export function ShareButton({ position }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `🎯 ${position.institution}\n📋 ${position.title}\n📍 ${position.city}\n🔢 ÖSYM: ${position.osymCode}\n\n#KPSS #KadroArama`;
  const shareUrl = `https://kpss-tercih-robotu.vercel.app/?kod=${position.osymCode}`;

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground border shadow-md rounded-md">
        <DropdownMenuItem 
          onClick={handleTwitterShare}
          className="cursor-pointer"
        >
          <Twitter className="h-4 w-4 mr-2 text-blue-500" />
          Twitter'da Paylaş
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleWhatsAppShare}
          className="cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
          WhatsApp'ta Paylaş
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleCopyLink}
          className="cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-emerald-500" />
              Kopyalandı!
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2 text-muted-foreground" />
              Linki Kopyala
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
