import { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "./authService";


// Create the context
export const AuthContext = createContext();

// Create hook to consume context (like your Flask example)
export const useAuth = () => {
    const context = useContext(AuthContext);
    return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [jwt, setJwt] = useState(null);

  
  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setJwt(data.token);
    setUser(data.user);
  };

  const register = async (email, password) => {
    const data = await registerUser(email, password);
    setJwt(data.token);
    setUser(data.user);
  };

  const value = {
    user,
    login,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


