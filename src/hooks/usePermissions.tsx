import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import';

export type ModuleKey = 
  | 'students' 
  | 'hr' 
  | 'classes' 
  | 'communication' 
  | 'financial' 
  | 'equipment' 
  | 'shop' 
  | 'events' 
  | 'settings';

interface Permission {
  module_key: ModuleKey;
  action: PermissionAction;
}

interface UsePermissionsReturn {
  permissions: Permission[];
  loading: boolean;
  hasPermission: (module: ModuleKey, action: PermissionAction) => boolean;
  canView: (module: ModuleKey) => boolean;
  canCreate: (module: ModuleKey) => boolean;
  canEdit: (module: ModuleKey) => boolean;
  canDelete: (module: ModuleKey) => boolean;
  canExport: (module: ModuleKey) => boolean;
  canImport: (module: ModuleKey) => boolean;
  isAdmin: boolean;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!profile?.user_id) {
      setPermissions([]);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Check if user is company owner (profile has company_id and is the creator)
      const { data: company } = await supabase
        .from('companies')
        .select('created_by')
        .eq('id', profile.company_id)
        .maybeSingle();

      if (company?.created_by === profile.user_id) {
        // Company owner has all permissions
        setIsAdmin(true);
        const allModules: ModuleKey[] = ['students', 'hr', 'classes', 'communication', 'financial', 'equipment', 'shop', 'events', 'settings'];
        const allActions: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'export', 'import'];
        const allPermissions: Permission[] = [];
        
        allModules.forEach(module => {
          allActions.forEach(action => {
            allPermissions.push({ module_key: module, action });
          });
        });
        
        setPermissions(allPermissions);
        setLoading(false);
        return;
      }

      // Check if user is staff and get their role permissions
      const { data: staffData } = await supabase
        .from('staff')
        .select(`
          role_id,
          roles:role_id (
            is_admin,
            role_permissions (
              module_key,
              action
            )
          )
        `)
        .eq('company_id', profile.company_id)
        .eq('email', profile.user_id) // This might need to be user email
        .maybeSingle();

      if (staffData?.roles) {
        const role = staffData.roles as any;
        setIsAdmin(role.is_admin || false);
        
        if (role.is_admin) {
          // Admin has all permissions
          const allModules: ModuleKey[] = ['students', 'hr', 'classes', 'communication', 'financial', 'equipment', 'shop', 'events', 'settings'];
          const allActions: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'export', 'import'];
          const allPermissions: Permission[] = [];
          
          allModules.forEach(module => {
            allActions.forEach(action => {
              allPermissions.push({ module_key: module, action });
            });
          });
          
          setPermissions(allPermissions);
        } else {
          setPermissions(role.role_permissions || []);
        }
      } else {
        // No staff record, might be the owner - give full access if onboarding completed
        if (profile.onboarding_completed) {
          setIsAdmin(true);
          const allModules: ModuleKey[] = ['students', 'hr', 'classes', 'communication', 'financial', 'equipment', 'shop', 'events', 'settings'];
          const allActions: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'export', 'import'];
          const allPermissions: Permission[] = [];
          
          allModules.forEach(module => {
            allActions.forEach(action => {
              allPermissions.push({ module_key: module, action });
            });
          });
          
          setPermissions(allPermissions);
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (module: ModuleKey, action: PermissionAction): boolean => {
      if (isAdmin) return true;
      return permissions.some(
        (p) => p.module_key === module && p.action === action
      );
    },
    [permissions, isAdmin]
  );

  const canView = useCallback((module: ModuleKey) => hasPermission(module, 'view'), [hasPermission]);
  const canCreate = useCallback((module: ModuleKey) => hasPermission(module, 'create'), [hasPermission]);
  const canEdit = useCallback((module: ModuleKey) => hasPermission(module, 'edit'), [hasPermission]);
  const canDelete = useCallback((module: ModuleKey) => hasPermission(module, 'delete'), [hasPermission]);
  const canExport = useCallback((module: ModuleKey) => hasPermission(module, 'export'), [hasPermission]);
  const canImport = useCallback((module: ModuleKey) => hasPermission(module, 'import'), [hasPermission]);

  return {
    permissions,
    loading,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canImport,
    isAdmin,
    refreshPermissions: fetchPermissions,
  };
}
