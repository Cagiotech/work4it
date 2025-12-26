import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PersonalNotification {
  id: string;
  company_id: string;
  user_id: string | null;
  user_type: string | null;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function usePersonalNotifications() {
  const [notifications, setNotifications] = useState<PersonalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Get staff info
  useEffect(() => {
    const fetchStaffInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('staff')
        .select('id, company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setStaffId(data.id);
        setCompanyId(data.company_id);
      }
    };

    fetchStaffInfo();
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!staffId || !companyId) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("company_id", companyId)
        .or(`user_type.eq.staff,user_id.eq.${staffId}`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifs = (data || []) as PersonalNotification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching personal notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [staffId, companyId]);

  useEffect(() => {
    if (staffId && companyId) {
      fetchNotifications();
    }
  }, [fetchNotifications, staffId, companyId]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!companyId || !staffId) return;

    const channel = supabase
      .channel(`personal-notifications-${staffId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          const newNotif = payload.new as PersonalNotification;
          // Only add if it's for staff type or specifically for this staff
          if (newNotif.user_type === "staff" || newNotif.user_id === staffId) {
            setNotifications(prev => [newNotif, ...prev].slice(0, 50));
            if (!newNotif.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, staffId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!companyId || !staffId) return;

    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [companyId, staffId, notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notif = notifications.find(n => n.id === notificationId);
      
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
