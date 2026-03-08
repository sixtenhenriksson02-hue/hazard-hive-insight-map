import { useState } from "react";
import { Bell, FileText, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useLanguage } from "@/hooks/useLanguage";

interface NotificationBellProps {
  onSelectReport?: (reportId: string) => void;
}

export default function NotificationBell({ onSelectReport }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.report_id && onSelectReport) {
      onSelectReport(notification.report_id);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">{t("notifications.title")}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("notifications.empty")}
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 px-4 py-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                  !n.read ? "bg-accent/5" : ""
                }`}
              >
                <div className={`shrink-0 mt-0.5 ${!n.read ? "text-accent" : "text-muted-foreground"}`}>
                  {n.type === "new_report" ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-medium" : ""}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString("sv-SE")}
                  </p>
                </div>
                {!n.read && (
                  <span className="shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
