import { useNavigate } from "react-router-dom";
import { User, Briefcase, Handshake, MessageCircleQuestion, Newspaper } from "lucide-react";
import NoticeTicker from "@/components/notices/NoticeTicker";
import NoticeBoardSection from "@/components/notices/NoticeBoardSection";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <>
      <NoticeTicker />
      <NoticeBoardSection
        title="Notice Board"
        subtitle="Latest updates from RBN — meetings, events, and reminders"
        limit={3}
        className="pt-6 pb-0"
      />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground break-words">
            Welcome to your Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Access your member benefits and resources
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <button
            type="button"
            onClick={() => navigate("/dashboard/leads")}
            className="flex h-full min-w-0 flex-col justify-between text-left bg-card rounded-xl border border-border p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex min-w-0 items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                <Handshake className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground break-words">My Leads</p>
                <p className="text-sm text-muted-foreground break-words">Share & track referrals</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/asks")}
            className="flex h-full min-w-0 flex-col justify-between text-left bg-card rounded-xl border border-border p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex min-w-0 items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                <MessageCircleQuestion className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground break-words">Ask Network</p>
                <p className="text-sm text-muted-foreground break-words">Post & browse asks</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/news")}
            className="flex h-full min-w-0 flex-col justify-between text-left bg-card rounded-xl border border-border p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex min-w-0 items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                <Newspaper className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground break-words">News & Stories</p>
                <p className="text-sm text-muted-foreground break-words">Latest community updates</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/profile")}
            className="flex h-full min-w-0 flex-col justify-between text-left bg-card rounded-xl border border-border p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex min-w-0 items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground break-words">My Profile</p>
                <p className="text-sm text-muted-foreground break-words">View & edit details</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/directory")}
            className="flex h-full min-w-0 flex-col justify-between text-left bg-card rounded-xl border border-border p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex min-w-0 items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground break-words">Business Directory</p>
                <p className="text-sm text-muted-foreground break-words">Browse members</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
