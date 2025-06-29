import { UserRole } from '../types';
import { roleHeirarchy } from './constants';

function hasAccess(userRole: UserRole, requiredRole: UserRole) {
  return roleHeirarchy.indexOf(userRole) >= roleHeirarchy.indexOf(requiredRole);
}

export default hasAccess;
