import { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '../data/mockData';

interface UserContextType {
  userRole: UserRole;
  toggleRole: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>('client');

  const toggleRole = () => {
    setUserRole((prev) => (prev === 'client' ? 'freelancer' : 'client'));
  };

  return (
    <UserContext.Provider value={{ userRole, toggleRole }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
