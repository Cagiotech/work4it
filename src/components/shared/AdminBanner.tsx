import { useState, useEffect } from "react";
import { X, ExternalLink, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Banner {
  id: string;
  title: string;
  message: string;
  image_url: string | null;
  link_text: string | null;
  link_url: string | null;
}

interface AdminBannerProps {
  audience: "companies" | "students" | "staff" | "all";
}

const DISMISSED_BANNERS_KEY = "dismissed_banners";
const HIDDEN_BANNERS_KEY = "hidden_banners_forever";

export function AdminBanner({ audience }: AdminBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    loadBanners();
  }, [audience]);

  const loadBanners = async () => {
    // Get dismissed and hidden banners from localStorage
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_BANNERS_KEY) || "[]");
    const hiddenForever = JSON.parse(localStorage.getItem(HIDDEN_BANNERS_KEY) || "[]");

    const { data, error } = await supabase
      .from("admin_banners")
      .select("*")
      .eq("is_active", true)
      .or(`target_audience.eq.all,target_audience.eq.${audience}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Filter out dismissed (session) and hidden (forever) banners
      const visibleBanners = data.filter(
        (banner) =>
          !dismissed.includes(banner.id) && !hiddenForever.includes(banner.id)
      );
      setBanners(visibleBanners);
    }
  };

  const dismissBanner = (bannerId: string, forever = false) => {
    if (forever) {
      const hidden = JSON.parse(localStorage.getItem(HIDDEN_BANNERS_KEY) || "[]");
      localStorage.setItem(HIDDEN_BANNERS_KEY, JSON.stringify([...hidden, bannerId]));
    } else {
      const dismissed = JSON.parse(localStorage.getItem(DISMISSED_BANNERS_KEY) || "[]");
      localStorage.setItem(DISMISSED_BANNERS_KEY, JSON.stringify([...dismissed, bannerId]));
    }
    setBanners(banners.filter((b) => b.id !== bannerId));
    setShowDialog(false);
    setDontShowAgain(false);
  };

  const openBannerDetails = (banner: Banner) => {
    setCurrentBanner(banner);
    setShowDialog(true);
  };

  if (banners.length === 0) return null;

  return (
    <>
      <div className="space-y-2 mb-4">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="flex items-center justify-between gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/15 transition-colors"
            onClick={() => openBannerDetails(banner)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Bell className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-sm truncate">{banner.title}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                dismissBanner(banner.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {currentBanner?.title}
            </DialogTitle>
          </DialogHeader>

          {currentBanner?.image_url && (
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}

          <p className="text-foreground whitespace-pre-wrap">{currentBanner?.message}</p>

          {currentBanner?.link_url && (
            <a
              href={currentBanner.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              {currentBanner?.link_text || "Saber mais"}
            </a>
          )}

          <div className="flex items-center space-x-2 pt-4 border-t">
            <Checkbox
              id="dontShow"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label htmlFor="dontShow" className="text-sm text-muted-foreground cursor-pointer">
              Não mostrar novamente
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => currentBanner && dismissBanner(currentBanner.id, dontShowAgain)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
