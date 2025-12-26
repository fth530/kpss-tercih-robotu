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
          className="h-8 w-8 text-slate-500 hover:text-white"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
        <DropdownMenuItem 
          onClick={handleTwitterShare}
          className="text-slate-300 hover:bg-slate-700 cursor-pointer"
        >
          <Twitter className="h-4 w-4 mr-2 text-blue-400" />
          Twitter'da Paylaş
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleWhatsAppShare}
          className="text-slate-300 hover:bg-slate-700 cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 mr-2 text-green-400" />
          WhatsApp'ta Paylaş
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleCopyLink}
          className="text-slate-300 hover:bg-slate-700 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-emerald-400" />
              Kopyalandı!
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2 text-slate-400" />
              Linki Kopyala
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
