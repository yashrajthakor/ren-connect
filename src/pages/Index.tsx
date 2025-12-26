import { Link } from "react-router-dom";

// Simple home/dashboard placeholder for signed-in users
const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-royal">
      <div className="max-w-3xl p-8 bg-card rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-display font-bold mb-4">Welcome to the Members Portal</h1>
        <p className="text-muted-foreground mb-6">
          This is placeholder content for the home page. After signing in you'll see this dashboard.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/login" className="text-primary hover:underline">
            Sign in / Switch user
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
