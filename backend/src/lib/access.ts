import { UserRole } from '../types';
import { roleHeirarchy } from './constants';

function hasAccess(userRole: UserRole, requiredRole: UserRole) {
  return roleHeirarchy.indexOf(userRole) >= roleHeirarchy.indexOf(requiredRole);
}

export function getAccessibleRoles(userRole: UserRole) {
  const userLevelIndex = roleHeirarchy.indexOf(userRole);
  if (userLevelIndex === -1) return [];

  return roleHeirarchy.slice(0, userLevelIndex + 1);
}

export default hasAccess;
