import { useNavigate } from "react-router-dom";
import { User, Briefcase, Handshake } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Welcome to your Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Access your member benefits and resources
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          type="button"
          onClick={() => navigate("/dashboard/leads")}
          className="text-left bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Handshake className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">My Leads</p>
              <p className="text-sm text-muted-foreground">Share & track referrals</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard/profile")}
          className="text-left bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">My Profile</p>
              <p className="text-sm text-muted-foreground">View & edit details</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard/directory")}
          className="text-left bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Business Directory</p>
              <p className="text-sm text-muted-foreground">Browse members</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;