import { usePage } from "@inertiajs/react";

/**
 * Custom hook for checking user permissions
 */
export const usePermissions = () => {
  const { auth } = usePage().props;

  const hasProjectPermission = (permission) => {
    return auth?.permissions?.project?.includes(permission) || false;
  };

  const hasUserPermission = (permission) => {
    return auth?.permissions?.user?.includes(permission) || false;
  };

  const hasClientPermission = (permission) => {
    return auth?.permissions?.client?.includes(permission) || false;
  };

  const hasBranchPermission = (permission) => {
    return auth?.permissions?.branch?.includes(permission) || false;
  };

  const hasDepartmentPermission = (permission) => {
    return auth?.permissions?.department?.includes(permission) || false;
  };

  const hasAnyProjectPermission = () => {
    return auth?.permissions?.project?.length > 0 || false;
  };

  const hasAnyUserPermission = () => {
    return auth?.permissions?.user?.length > 0 || false;
  };

  const hasAnyClientPermission = () => {
    return auth?.permissions?.client?.length > 0 || false;
  };

  const hasAnyBranchPermission = () => {
    return auth?.permissions?.branch?.length > 0 || false;
  };

  const hasAnyDepartmentPermission = () => {
    return auth?.permissions?.department?.length > 0 || false;
  };

  const canViewProjectsTable = () => {
    return hasProjectPermission("View Projects Data Table");
  };

  const canViewSingleProject = () => {
    return hasProjectPermission("View Single Project");
  };

  const canCreateProject = () => {
    return hasProjectPermission("Create Project");
  };

  const canUpdateProject = () => {
    return hasProjectPermission("Update Project");
  };

  const canDeleteProject = () => {
    return hasProjectPermission("Delete Project");
  };

  // User permissions
  const canViewUser = () => {
    return hasUserPermission("View User");
  };

  const canCreateUser = () => {
    return hasUserPermission("Create User");
  };

  const canUpdateUser = () => {
    return hasUserPermission("Update User");
  };

  const canDeleteUser = () => {
    return hasUserPermission("Delete User");
  };

  // Client permissions
  const canViewClient = () => {
    return hasClientPermission("View Client");
  };

  const canCreateClient = () => {
    return hasClientPermission("Create Client");
  };

  const canUpdateClient = () => {
    return hasClientPermission("Update Client");
  };

  const canDeleteClient = () => {
    return hasClientPermission("Delete Client");
  };

  // Branch permissions
  const canViewBranch = () => {
    return hasBranchPermission("View Branches");
  };

  const canCreateBranch = () => {
    return hasBranchPermission("Create Branch");
  };

  const canUpdateBranch = () => {
    return hasBranchPermission("Update Branch");
  };

  const canDeleteBranch = () => {
    return hasBranchPermission("Delete Branch");
  };

  // Department permissions
  const canViewDepartment = () => {
    return hasDepartmentPermission("View Department");
  };

  const canCreateDepartment = () => {
    return hasDepartmentPermission("Create Department");
  };

  const canUpdateDepartment = () => {
    return hasDepartmentPermission("Update Department");
  };

  const canDeleteDepartment = () => {
    return hasDepartmentPermission("Delete Department");
  };

  // Column-level permissions
  const canViewInitLink = () => {
    return hasProjectPermission("View Init Link");
  };

  const canUpdateInitLink = () => {
    return (
      hasProjectPermission("Create Init Link") ||
      hasProjectPermission("Update Init Link")
    );
  };

  const canViewAdminNotes = () => {
    return hasProjectPermission("View Admin Notes");
  };

  const canUpdateAdminNotes = () => {
    return (
      hasProjectPermission("Create Admin Notes") ||
      hasProjectPermission("Update Admin Notes")
    );
  };

  const canViewPrivateNotes = () => {
    return hasProjectPermission("View Private Notes");
  };

  const canUpdatePrivateNotes = () => {
    return (
      hasProjectPermission("Create Private Notes") ||
      hasProjectPermission("Update Private Notes")
    );
  };

  const canViewTotalBudget = () => {
    return hasProjectPermission("View Total Budget");
  };

  const canUpdateTotalBudget = () => {
    return (
      hasProjectPermission("Create Total Budget") ||
      hasProjectPermission("Update Total Budget")
    );
  };

  const canViewDeductionAmount = () => {
    return hasProjectPermission("View Deduction Amount");
  };

  const canUpdateDeductionAmount = () => {
    return (
      hasProjectPermission("Create Deduction Amount") ||
      hasProjectPermission("Update Deduction Amount")
    );
  };

  return {
    // General permission checkers
    hasProjectPermission,
    hasUserPermission,
    hasClientPermission,
    hasBranchPermission,
    hasDepartmentPermission,
    hasAnyProjectPermission,
    hasAnyUserPermission,
    hasAnyClientPermission,
    hasAnyBranchPermission,
    hasAnyDepartmentPermission,

    // Route-level permissions
    canViewProjectsTable,
    canViewSingleProject,
    canCreateProject,
    canUpdateProject,
    canDeleteProject,

    // User permissions
    canViewUser,
    canCreateUser,
    canUpdateUser,
    canDeleteUser,

    // Client permissions
    canViewClient,
    canCreateClient,
    canUpdateClient,
    canDeleteClient,

    // Branch permissions
    canViewBranch,
    canCreateBranch,
    canUpdateBranch,
    canDeleteBranch,

    // Department permissions
    canViewDepartment,
    canCreateDepartment,
    canUpdateDepartment,
    canDeleteDepartment,

    // Column-level permissions
    canViewInitLink,
    canUpdateInitLink,
    canViewAdminNotes,
    canUpdateAdminNotes,
    canViewPrivateNotes,
    canUpdatePrivateNotes,
    canViewTotalBudget,
    canUpdateTotalBudget,
    canViewDeductionAmount,
    canUpdateDeductionAmount,
  };
};

/**
 * Permission wrapper component
 */
export const PermissionWrapper = ({
  permission,
  children,
  fallback = null,
  checkProjectPermission = true,
}) => {
  const {
    hasProjectPermission,
    hasUserPermission,
    hasClientPermission,
    hasBranchPermission,
    hasDepartmentPermission,
  } = usePermissions();

  const hasPermission = checkProjectPermission
    ? hasProjectPermission(permission)
    : hasUserPermission(permission) ||
      hasClientPermission(permission) ||
      hasBranchPermission(permission) ||
      hasDepartmentPermission(permission);

  if (!hasPermission) {
    return fallback;
  }

  return children;
};

/**
 * Project-specific permission wrapper
 */
export const ProjectPermission = ({
  permission,
  children,
  fallback = null,
}) => {
  return (
    <PermissionWrapper
      permission={permission}
      checkProjectPermission={true}
      fallback={fallback}
    >
      {children}
    </PermissionWrapper>
  );
};

/**
 * User-specific permission wrapper
 */
export const UserPermission = ({ permission, children, fallback = null }) => {
  return (
    <PermissionWrapper
      permission={permission}
      checkProjectPermission={false}
      fallback={fallback}
    >
      {children}
    </PermissionWrapper>
  );
};

/**
 * Client-specific permission wrapper
 */
export const ClientPermission = ({ permission, children, fallback = null }) => {
  return (
    <PermissionWrapper
      permission={permission}
      checkProjectPermission={false}
      fallback={fallback}
    >
      {children}
    </PermissionWrapper>
  );
};

/**
 * Branch-specific permission wrapper
 */
export const BranchPermission = ({ permission, children, fallback = null }) => {
  return (
    <PermissionWrapper
      permission={permission}
      checkProjectPermission={false}
      fallback={fallback}
    >
      {children}
    </PermissionWrapper>
  );
};

/**
 * Department-specific permission wrapper
 */
export const DepartmentPermission = ({
  permission,
  children,
  fallback = null,
}) => {
  return (
    <PermissionWrapper
      permission={permission}
      checkProjectPermission={false}
      fallback={fallback}
    >
      {children}
    </PermissionWrapper>
  );
};
