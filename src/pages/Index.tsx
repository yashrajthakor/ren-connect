import { Navigate } from "react-router-dom";

// Redirect to login as the main entry point
const Index = () => {
  return <Navigate to="/login" replace />;
};

export default Index;
